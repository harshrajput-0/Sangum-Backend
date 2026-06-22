import crypto from "crypto";
import mongoose from "mongoose";
import { AuthUserResponse } from "./auth.types";

// Token hashing
const hashToken = (token:string): string => crypto.createHash("sha256").update(token).digest("hex");

// generate token
const generateRandomToken = (): string => crypto.randomBytes(32).toString("hex");


const toAuthUserResponse = (user: any, account: any): AuthUserResponse => ({
    _id: user._id.toString(),
    userId: user._id.toString(),
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    role: user.role,
    isProfileComplete: user.isProfileComplete,
    isVerified: account.isVerified,
    hasEmail: account.hasEmail,
})
    