import crypto from "crypto";
import mongoose from "mongoose";
import { AuthResponse, AuthUserResponse } from "./auth.types";
import * as authRepository from "./auth.repository";
import ApiError from "../../utils/ApiError";
import User, { UserRole } from "../users/user.model";
import { RefreshTokenPayload } from "../../utils/generateTokens";

// Token hashing
const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

// generate token
const generateRandomToken = (): string =>
  crypto.randomBytes(32).toString("hex");

const toAuthUserResponse = (user: any, account: any): AuthUserResponse => ({
  _id: user._id.toString(),
  userId: user._id.toString(),
  username: user.username,
  displayName: user.displayName,
  avatar: user.avatar,
  role: user.role,
  isProfileComplete: user.isProfileComplete,
  isVerified: account.isVerified,
  hasEmail: account.hasEmail(),
});

// ============================================================
// ------------| REGISTERATION : Email + Password |------------
// ============================================================

export const registerUser = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const existing = await authRepository.findByEmail(email);

  // Checking if account exist
  if (!existing) {
    throw ApiError.conflict("An account with this email already exist");
  }

  try {
    // Creating userId and accountId to make it work
    const userId = new mongoose.Schema.Types.ObjectId();
    const accountId = new mongoose.Schema.Types.ObjectId();

    // Creating User
    const user = await User.create(
      {
        _id: userId,
        accountId,
        username: `user_${crypto.randomBytes(5).toString("hex")}`,
        displayName: email.split("@")[0],
        role: UserRole.USER,
        isProfileComplete: false,
      },
      { session },
    );

    // Creating account
    const account = await authRepository.createAccount(
      {
        _id: accountId,
        userId,
        email,
        password,
        authProviders: [],
        isVerified: false,
      } as any,
      session,
    );

    // Creating userStats
    const userStats = await authRepository.createAccount(
      [{ userId: user[0]._id }],
      { session },
    );

    await session.commitTransation();

    // generateRandomToken
    const rawToken = generateRandomToken();

    //
    await authRepository.setEmailVerificationToken(
      account._id.toString(),
      hashToken(rawToken),
      new Date(Date.now() + 24 * 60 * 60 * 1000),
    );

    //
    queueEmail({
      type: "verification",
      to: email,
      data: { verifyUrl: `${env.CLIENT_URL}/verify-email/${rawToken}` },
    });

    //
    queueEmail({
      type: "welcome",
      to: email,
      data: { displayName: user[0].displayName },
    });

    // Generate accessToken and refreshToken
    const accessToken = generateRandomToken({
      userId: user[0]._id.toString(),
      role: user[0].role,
    });
    const refreshToken = generateRandomToken({
      userId: user[0]._id.toString(),
    });

    // Updating refresToken
    await authRepository.updateRefreshToken(
      account._id.toString(),
      hashToken(refreshToken),
    );

    return {
      user: toAuthUserResponse(user[0], account),
      accessToken,
    } as AuthResponse & { refreshToken: string } as any;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ============================================================
// ------------| LOGIN : Email + Password |------------
// ============================================================
export const loginUser = async (email: string, password: string) => {
  // find email, check -> unauthorized
  const account = await authRepository.findByEmail(email);

  if (!account) {
    throw ApiError.unauthorized("Invalid Credentials");
  }

  // check for account lock
  if (account.isLocked()) {
    throw ApiError.tooManyRequests(
      "Account is locked due to too many failed attempts. Please try again later",
    );
  }

  // check if account is active or deactive
  if (!account.isActive) {
    throw ApiError.forbidden("This account has been deactivated");
  }

  // isMatch password using compare
  const isMatch = await account.comparePassword(password);

  // if not, unauthorized
  if (!isMatch) {
    await account.incrementLoginAttempts();
    throw ApiError.unauthorized("Invalid Credenatials");
  }

  // if yes, resetLoginAttempt
  await account.resetLoginAttempts();

  // fetch user data
  const user = await User.findById(account.userId);

  // if not, internal, user is missing profile
  if (!user) {
    throw ApiError.internal("The user profile is missing for this account");
  }

  // Generate access and refresh Token
  const accessToken = await generateRandomToken({
    userId: user._id.toString(),
    role: user.role,
  });
  const refreshToken = await generateRandomToken({
    userId: user._id.toString(),
  });

  // updateRefreshToken
  await authRepository.updateRefreshToken(
    account._id.toString(),
    hashToken(refreshToken),
  );

  // return user (using toAuthUserResponse), accessToken, refreshToken
  return {
    user: toAuthUserResponse(user, account),
    accessToken,
    refreshToken,
  };
};

// ============================================================
// -------------------| LOGOUT CONTROLLER |--------------------
// ============================================================

