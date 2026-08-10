import Account, {
  IAccount,
  IOAuthProvider,
  AuthProvider,
} from "./account.model.js";
import UserStats from "../users/userStat.model.js";
import mongoose, { ClientSession } from "mongoose";

// find by email
export const findByEmail = (email: string) => {
  return Account.findOne({ email }).select("+password +refreshToken"); // required to compare as password as select: false now,
};

// find by userId
export const findByUserId = (userId: string) => {
  return Account.findOne({ userId }).select("+refreshToken");
};

// find by accountId
export const findById = (accountId: string) => {
  return Account.findById({ accountId }).select(" +refreshToken ");
};

export const findByOAuthProvider = (
  provider: AuthProvider,
  providerId: string,
) => {
  return Account.findOne({
    authProviders: { $elemMatch: { provider, providerId } },
  });
};

// Create Account
export const createAccount = async (data: Partial<IAccount>, session?: ClientSession) => {
  const [account] = await Account.create([data], {session: session ?? null});
  return account;
};

// Create userStats
export const createUserStats = async (
  data: { userId: mongoose.Types.ObjectId }[],
  session?: ClientSession,
) => {
  const [stats] = await UserStats.create(data, { session: session ?? null });
  return stats;
};

// Update Refresh Token using hashedToken
export const updateRefreshToken = (accountId: string, hashedToken: string) => {
  return Account.findByIdAndUpdate(accountId, { refreshToken: hashedToken });
};

// Clearing refreshToken
export const clearRefreshToken = (accountId: string) => {
  return Account.findByIdAndUpdate(accountId, { $unset: { refreshToken: 1 } });
};

// Setting passwordResetToken fields
export const setPasswordResetToken = (
  accountId: string,
  hashedToken: string,
  expiry: Date,
) => {
  return Account.findByIdAndUpdate(accountId, {
    passwordResetToken: hashedToken,
    passwordResetExpiry: expiry,
  });
};

// Find using passwordResetToken
export const findByPasswordResetToken = (hashedToken: string) => {
  return Account.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpiry");
};

// Clear passwordReset fields
export const clearPasswordResetToken = (accountId: string) => {
  return Account.findByIdAndUpdate(accountId, {
    $unset: { passwordResetToken: 1, passwordResetExpiry: 1 },
  });
};

// Setting emailVerification fields
export const setEmailVerificationToken = (
  accountId: string,
  hashedToken: string,
  expiry: Date,
) => {
  return Account.findByIdAndUpdate(accountId, {
    emailVerificaiontToken: hashedToken, // was emailVerificaiontToken
    emailVerificationExpiry: expiry,
  });
};

// Find using emailverificationToken
export const findByVerificationToken = (hashedToken: string) => {
  return Account.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: new Date() },
  }).select("+emailVerificaiontToken +emailVerificationExpiry"); // was emailVerificaiontToken
};

// Mark if emailVerified or not
export const markEmailVerified = (accountId: string) => {
  return Account.findByIdAndUpdate(accountId, {
    isVerified: true,
    $unset: {
      emailVerificationToken: 1,
      emailVerificationExpiry: 1,
    },
  });
};

// Updating the Password
export const updatePassword = (accountId: string, newPassword: string) => {
  // Find account using accountId ----> update account directly ----> then save acoount
  return Account.findById(accountId).then((account) => {
    if (!account) return null;

    account.password = newPassword;
    return account.save();
  });
};

// Add authProviders field
export const addOAuthProvider = (
  accountId: string,
  providerData: IOAuthProvider,
) => {
  return Account.findByIdAndUpdate(
    accountId,
    { $push: { authProviders: providerData } },
    { new: true }, // return the updated document, not the pre-update one
  );
};

// Set Emaill in Account using accountId
export const setEmail = (accountId: string, email: string) => {
  return Account.findByIdAndUpdate(accountId, { email }, { new: true });
};

// Check Email in Account
export const checkEmailExists = (email: string) => {
  return Account.exists({ email });
};
