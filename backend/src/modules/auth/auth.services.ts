import crypto from "crypto";
import mongoose from "mongoose";
import { AuthResponse, AuthUserResponse } from "./auth.types";
import * as authRepository from "./auth.repository";
import ApiError from "../../utils/ApiError";
import User, { UserRole } from "../users/user.model";
import {
  generateAccessToken,
  generateRefreshToken,
  AccessTokenPayload,
  RefreshTokenPayload,
  verifyRefreshToken,
} from "../../utils/generateTokens";

import { env } from "../../config/env";
import { throwDeprecation } from "process";

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

  // BUG FIX - session start
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Creating userId and accountId to make it work
    const userId = new mongoose.Types.ObjectId();
    const accountId = new mongoose.Types.ObjectId();

    // Creating User
    const [user] = await User.create(
      [
        {
          _id: userId,
          accountId,
          username: `user_${crypto.randomBytes(5).toString("hex")}`,
          displayName: email.split("@")[0] ?? email, // Bug fix fall back
          role: UserRole.USER,
          isProfileComplete: false,
        },
      ],
      { session },
    );

    // Fix Applied for - "user" possibly undefined error
    if (!user) throw ApiError.internal("Failed to create user");

    // Creating account
    const account = await authRepository.createAccount(
      {
        _id: accountId,
        userId,
        email,
        password,
        authProviders: [],
        isVerified: false,
      },
      session,
    );

    // Fix Applied for - "account" possibly undefined error
    if (!account) throw ApiError.internal("Failed to create account");

    // Creating userStats
    const userStats = await authRepository.createUserStats(
      [{ userId: user._id }],
      session,
    );
    // Fix Applied for - "userStats" possibly undefined error
    if (!userStats) throw ApiError.internal("Failed to create user stats");

    await session.commitTransaction();

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
      data: { displayName: user.displayName },
    });

    // Generate accessToken and refreshToken
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
    });

    // Updating refresToken
    await authRepository.updateRefreshToken(
      account._id.toString(),
      hashToken(refreshToken),
    );

    return {
      user: toAuthUserResponse(user, account),
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

  // Generate access and refresh To
  const accessToken = await generateAccessToken({
    userId: user._id.toString(),
    role: user.role,
  });
  const refreshToken = await generateRefreshToken({
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
export const logoutUser = async (userId: string) => {
// Getting account
const account = await authRepository.findByUserId(userId);

// Clear refreshToken of that account
if(account){
  await authRepository.clearRefreshToken(account._id.toString());
}
}

// ============================================================
// -----------------| REFRESH ACCESS TOKEN |-------------------
// ============================================================
export const refreshAccessToken = async (refreshToken: string) => {
// initialize payload
let payload;

// check refresh token, if not unauthorized
try {
  payload = verifyRefreshToken(refreshToken);
} catch (error) {
  throw ApiError.unauthorized("Invalid or expired refresh token");
};

// find account
const account = authRepository.findByUserId(payload.userId);

// if acount doesn't have refreshToken then session not found
if(!account || !account.refreshToken ){
  throw ApiError.unauthorized("Session not found. Please login again");
};

// incoming Hash(resfreshToken)
const incomingRefreshToken = hashToken(refreshToken);

// compare with account token, if not session expired
if(incomingRefreshToken !== account.refreshToken){
  throw ApiError.unauthorized("Invalid session. Please login again");
};

// find user wiht accountUserId, then internal
const user = await User.findById(account.userId);

if(!user){
  throw ApiError.internal("User profile is missing for this user")
}

// Generate both tokens
const newAccessToken =  generateAccessToken({ userId: user._id.toString(), role: user.role });
const newRefreshToken =  generateRefreshToken({ userId: user._id.toString() });

// update the refresh Token
await authRepository.updateRefreshToken(account._id.toString(), hashToken(newRefreshToken));

return {
  user: toAuthUserResponse(user, account),
  accessToken: newAccessToken,
  refreshToken: newRefreshToken,
};
}