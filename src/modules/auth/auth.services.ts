import crypto from "crypto";
import mongoose from "mongoose";
import { AuthResponse, AuthUserResponse, OAuthProfile } from "./auth.types.js";
import * as authRepository from "./auth.repository.js";
import * as userRepository from "../users/user.repository.js";
import { generateUniqueUsername } from "../users/user.services.js";
import { ApiError } from "../../utils/ApiError.js";
import User, { UserRole } from "../users/user.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  // AccessTokenPayload,
  // RefreshTokenPayload,
  verifyRefreshToken,
} from "../../utils/generateTokens.js";

import { env } from "../../config/env.js";
import UserStats from "../users/userStats.model.js";

import { sendEmail } from "../../services/email.service.js";
import { verificationTemplate } from "../../templates/verification.template.js";
import { resetPasswordTemplate } from "../../templates/reset-password.template.js";

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
  hasEmail: !account.needsEmail(), // <-- frontend uses this to branch onboarding
  email: account.email ?? null,
});

// How long an unverified account "holds" its email/username before a
// fresh registration attempt is allowed to reclaim them. Must match
// the copy in verification.template.ts ("This link expires in 24
// hours") and JWT_EMAIL_VERIFICATION_EXPIRY in env — if either changes,
// this should move with it.
const PENDING_VERIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000;

// Deletes a stale, never-verified account (and its User/UserStats rows)
// so its email/username can be reused by a new registration. Only ever
// called on accounts already confirmed to be unverified and older than
// PENDING_VERIFICATION_WINDOW_MS — see registerUser below.
const reclaimStaleAccount = async (staleAccount: {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}): Promise<void> => {
  await User.findByIdAndDelete(staleAccount.userId);
  await UserStats.findOneAndDelete({ userId: staleAccount.userId });
  await authRepository.deleteAccountById(staleAccount._id.toString());
};

// ============================================================
// ------------| REGISTERATION : Email + Password |------------
// ============================================================
export const registerUser = async (
  email: string,
  password: string,
  username: string,
): Promise<AuthResponse> => {
  // Username conflict gets the same treatment as email below — checked
  // up front, friendly 409, nothing left to a raw Mongo E11000 mid-transaction.
  const usernameTaken = await userRepository.usernameExist(username);
  if (usernameTaken) {
    throw ApiError.conflict("This username is already taken");
  }

  const existing = await authRepository.findByEmail(email);

  if (existing) {
    if (existing.isVerified) {
      throw ApiError.conflict("An account with this email already exist");
    }

    // Unverified account already sitting on this email — how we handle
    // it depends on whether it's still inside its own verification
    // window (see auth-module-bug-history.md-style writeup in
    // docs/known-risks.md for the full reasoning).
    const accountAgeMs = Date.now() - existing.createdAt.getTime();

    if (accountAgeMs < PENDING_VERIFICATION_WINDOW_MS) {
      // Still within the window we told them the link is good for.
      // Don't hard-error — resend a fresh (still-valid) link as a
      // courtesy and tell the frontend exactly what happened via `code`
      // so it can route to the "check your inbox" screen instead of
      // showing a generic red form error.
      //
      // No dedicated cooldown on this specific path yet — tracked in
      // docs/known-risks.md ("auto-resend on register conflict").
      await sendVerificationEmail(existing._id.toString(), email, undefined);
      throw ApiError.conflict(
        "An account with this email already exists but isn't verified. We sent a fresh verification link.",
        "ACCOUNT_PENDING_VERIFICATION",
      );
    }

    // Past the window and still unverified — the original link is dead
    // either way, so this email (and whatever username it was holding)
    // is fair game. Wipe it and fall through to a normal registration.
    await reclaimStaleAccount(existing);
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
          username,
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

    // Fire off verification email AFTER commit — never email the user
    // about an account that might still roll back.

    await sendVerificationEmail(
      account._id.toString(),
      email,
      user.displayName,
    );

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
      refreshToken,
      // refreshToken returned separately to the controller, which sets
      // it as a cookie — see auth.controller.ts → register
      // (not part of AuthResponse type because it never belongs in JSON)
    } as AuthResponse;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
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
  if (account) {
    await authRepository.clearRefreshToken(account._id.toString());
  }
};

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
  }

  // find account
  const account = await authRepository.findByUserId(payload.userId);

  // if acount doesn't have refreshToken then session not found
  if (!account || !account.refreshToken) {
    throw ApiError.unauthorized("Session not found. Please login again");
  }

  // incoming Hash(resfreshToken)
  const incomingRefreshToken = hashToken(refreshToken);

  // compare with account token, if not session expired
  if (incomingRefreshToken !== account.refreshToken) {
    throw ApiError.unauthorized("Invalid session. Please login again");
  }

  // find user wiht accountUserId, then internal
  const user = await User.findById(account.userId);

  if (!user) {
    throw ApiError.internal("User profile is missing for this user");
  }

  // Generate both tokens
  const newAccessToken = generateAccessToken({
    userId: user._id.toString(),
    role: user.role,
  });
  const newRefreshToken = generateRefreshToken({ userId: user._id.toString() });

  // update the refresh Token
  await authRepository.updateRefreshToken(
    account._id.toString(),
    hashToken(newRefreshToken),
  );

  return {
    user: toAuthUserResponse(user, account),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

// ============================================================
// -----------------| GET CURRENT USER (/me) |------------------
// ============================================================
// Read-only version of refreshAccessToken above.
// It returns the same AuthUserResponse, but does not rotate tokens, set cookies,
// or use the auth rate limiter.
//
// Use this whenever the frontend already has a valid access token and needs
// the latest user state—for example, after completing onboarding or during
// periodic revalidation.
//
// Unlike the refresh-token flow, this cannot be used on a cold page load because
// the frontend does not have an access token yet.
export const getCurrentUser = async (
  userId: string,
): Promise<AuthUserResponse> => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.internal("User profile is missing for this user");
  }

  const account = await authRepository.findByUserId(userId);
  if (!account) {
    throw ApiError.internal("Account is missing for this user");
  }

  return toAuthUserResponse(user, account);
};

// ============================================================
// ----------------| FORGOT OR RESET PASSWORD |----------------
// ============================================================
export const forgotPassword = async (email: string): Promise<void> => {
  // find email
  const account = await authRepository.findByEmail(email);

  // check if account exist?
  if (!account) return;

  // raw token
  const rawToken = generateRandomToken();
  console.log("FRESH RESET TOKEN:", rawToken); // 👈 add this

  // set password reset tokekn
  await authRepository.setPasswordResetToken(
    account._id.toString(),
    hashToken(rawToken),
    new Date(Date.now() + 60 * 60 * 1000),
  );

  sendEmail({
    to: email,
    subject: "Reset your password",
    html: resetPasswordTemplate(`${env.CLIENT_URL}/reset-password/${rawToken}`),
  }).catch((err) => console.error("Failed to send reset email:", err));
};

export const resetPassword = async (
  rawToken: string,
  newPassword: string,
): Promise<void> => {
  console.log(
    "raw token received:",
    JSON.stringify(rawToken),
    "length:",
    rawToken.length,
  );
  console.log("hashed to:", hashToken(rawToken));
  console.log("server's current time:", new Date().toISOString());

  // find by resetpasswordtoken
  const account = await authRepository.findByPasswordResetToken(
    hashToken(rawToken),
  );
  console.log("account found:", account ? account._id : null);

  // check if reset token to that account exist
  if (!account) {
    throw ApiError.badRequest("The token is invalid or expired");
  }

  // save the new password
  account.password = newPassword;

  // wait for account details to save
  await account.save();

  // clear reset password token once used
  await authRepository.clearPasswordResetToken(account._id.toString());

  // clear refresh token, to make existing session valid (especially if password is compromised)
  await authRepository.clearRefreshToken(account._id.toString());
};

// ============================================================
// ----------------| EMAIL VERIFICATION CODE |----------------
// ============================================================
// Verification tokens are stateless JWTs (utils/generateTokens.ts) —
// there's nothing stored in the DB to look up or overwrite. This means:
//  - Resending never invalidates a still-outstanding earlier link
//    (each JWT is independently valid until its own expiry).
//  - Re-clicking an already-used link is a safe no-op, not an error —
//    important now that multiple valid links can be outstanding at once.
export const verifyEmail = async (rawToken: string) => {
  let payload;
  try {
    payload = verifyEmailVerificationToken(rawToken);
  } catch {
    throw ApiError.badRequest("Verification link is invalid or expired");
  }

  const account = await authRepository.findById(payload.accountId);
  if (!account) {
    throw ApiError.badRequest("Verification link is invalid or expired");
  }

  // Idempotent: an already-verified account hitting this again (e.g. an
  // older link clicked after a newer one already verified them) just
  // succeeds quietly instead of erroring.
  if (account.isVerified) {
    return;
  }

  await authRepository.markEmailVerified(account._id.toString());
};

const sendVerificationEmail = async (
  accountId: string,
  email: string,
  displayName?: string,
) => {
  const token = generateEmailVerificationToken(accountId);
  sendEmail({
    to: email,
    subject: "Verify your email",
    html: verificationTemplate(
      `${env.CLIENT_URL}/verify-email/${token}`,
      displayName,
    ),
  }).catch((err) => console.error("Failed to send verification email:", err));
};

export const resendVerificationEmail = async (userId: string) => {
  // find account
  const account = await authRepository.findByUserId(userId);

  // question account existence
  if (!account) {
    throw ApiError.notFound("Account Not Found");
  }
  if (!account.email) {
    throw ApiError.badRequest("No email found in account");
  }

  // check if verified
  if (account.isVerified) {
    throw ApiError.badRequest("Email is already verified");
  }

  await sendVerificationEmail(account._id.toString(), account.email); // Sends actual email
};

// ============================================================
// ---------------| HANDLE OAUTH LOGIN SERVICE |---------------
// ============================================================
export const handleOAuthLogin = async (profile: OAuthProfile) => {
  // CASE 1 - Retruning user

  // find account
  const account = await authRepository.findByOAuthProvider(
    profile.provider,
    profile.providerId,
  );

  if (account) {
    // if true -> find using user profile -> if not handle it
    const user = await User.findById(account.userId);
    if (!user) {
      throw ApiError.internal("User profile is missing for this account");
    }

    // generate token and update
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
    });
    await authRepository.updateRefreshToken(
      account._id.toString(),
      hashToken(refreshToken),
    );

    // return users and tokens
    return {
      user: toAuthUserResponse(user, account),
      accessToken,
      refreshToken,
    };
  }

  // ===[ CASE 2 - Linking to existing user acount ]-----------------------------
  if (profile.email) {
    // check profile email and find account
    const account = await authRepository.findByEmail(profile.email);

    // add OAuthProvider
    if (account) {
      await authRepository.addOAuthProvider(account._id.toString(), {
        provider: profile.provider,
        providerId: profile.providerId,
        connectedAt: new Date(),
      });

      // if account email is not verified then verify it OAuth provides verification
      if (!account.isVerified) {
        await authRepository.markEmailVerified(account._id.toString());
      }

      // find account using user profile -> if not handle it
      const user = await User.findById(account.userId);
      if (!user) {
        throw ApiError.internal("User profile is missing for this account");
      }

      // generate token and update
      const accessToken = generateAccessToken({
        userId: user._id.toString(),
        role: user.role,
      });
      const refreshToken = generateRefreshToken({
        userId: user._id.toString(),
      });
      await authRepository.updateRefreshToken(
        account._id.toString(),
        hashToken(refreshToken),
      );

      // return users and tokens
      return {
        user: toAuthUserResponse(user, account),
        accessToken,
        refreshToken,
      };
    }
  }

  // ===[ CASE 3 - Creating user ]---------------------------------
  // start session
  const session = await mongoose.startSession();
  session.startTransaction();

  // Creating three accounts, as in registerUser
  try {
    const userId = new mongoose.Types.ObjectId();
    const accountId = new mongoose.Types.ObjectId();

    // Create User
    const [user] = await User.create(
      [
        {
          _id: userId,
          accountId,
          username: await generateUniqueUsername(
            profile.email ?? profile.displayName,
          ),
          displayName: profile.displayName,
          // Seed from the OAuth provider's profile picture when available so
          // onboarding step 2 (avatar) can default to it instead of falling
          // back to a generated identicon. Local/email registration never
          // has this, so `avatar` stays null there as before.
          ...(profile.avatar ? { avatar: profile.avatar } : {}),
          role: UserRole.USER,
          isProfileComplete: false,
        },
      ],
      { session },
    );
    if (!user) throw ApiError.internal("Failed to create account");

    const account = await authRepository.createAccount(
      {
        _id: accountId,
        userId,
        ...(profile.email ? { email: profile.email } : {}),
        authProviders: [
          {
            provider: profile.provider,
            providerId: profile.providerId,
            connectedAt: new Date(),
          },
        ],

        isVerified: !!profile.email,
      },
      session,
    );

    if (!account) throw ApiError.internal("Failed to create account");

    await UserStats.create([{ userId: user._id }], { session });

    await session.commitTransaction();

    // generate token and update
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
    });
    const refreshToken = generateRefreshToken({ userId: user._id.toString() });
    await authRepository.updateRefreshToken(
      account._id.toString(),
      hashToken(refreshToken),
    );

    // return user and tokens
    return {
      user: toAuthUserResponse(user, account),
      accessToken,
      refreshToken,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ============================================================
// ---------------------| COMPLETE Email |---------------------
// ============================================================
export const completeEmail = async (
  userId: string,
  email: string,
): Promise<void> => {
  const emailExist = await authRepository.checkEmailExists(email);

  // check if email already exist, if yes conflict
  if (emailExist) {
    throw ApiError.conflict("An account with this email already exist");
  }

  //  find account usign id, if not -> not fount
  const account = await authRepository.findByUserId(userId);
  if (!account) {
    throw ApiError.notFound("Account not found");
  }

  // if account.haseamil not, bad request (account has email)
  if (!account.needsEmail()) {
    throw ApiError.badRequest("This account already has an email register");
  }

  // set email with account and email
  await authRepository.setEmail(account._id.toString(), email);
  await sendVerificationEmail(account._id.toString(), email); // Sends the actual mail
};

// ============================================================
// --------------------| CHANGE PASSWORD |---------------------
// ============================================================
// For Authenticated User - current-password-verificaiton required
// Seperate from forgetPassword/resetPassword which is for
// unauthenticated user: token based for someone locked out
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const account = await authRepository.findByUserIdWithPassword(userId);
  if (!account) {
    throw ApiError.notFound("Account not found");
  }

  // OAuth account have no password to verify
  // Send them throudh forget-password to set one instead of failling
  if (!account.password) {
    throw ApiError.badRequest(
      "This account doesn't have password set yet. User 'Froget password' to set one",
    );
  }

  const isMatch = await account.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.unauthorized("Current password is incorrect");
  }

  await authRepository.updatePassword(account._id.toString(), newPassword);

  await authRepository.clearRefreshToken(account._id.toString());

  return;
};

// ===============================================================
// --------------------| CONNECTED ACCOUNTS |---------------------
// ===============================================================
// Read only for now - only reports providers linked via
// register/login via OAuth

// TODO: CREATE A CONNECT FLOW WHEN AUTHENTICATED -------------------------------
export const getConnectedAccounts = async (userId: string) => {
  const account = await authRepository.findByUserId(userId);

  if (!account) {
    throw ApiError.notFound("Account not found");
  }

  return account.authProviders.map((p) => ({
    provider: p.provider,
    connectedAt: p.connectedAt,
  }));
};