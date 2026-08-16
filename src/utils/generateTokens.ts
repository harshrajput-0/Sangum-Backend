import jwt from "jsonwebtoken";
import { UserRole } from "../modules/users/user.model.js";
import { env } from "../config/env.js";
import crypto from "crypto";

// ======| PAYLOAD INTERFACE |======
export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  userId: string;
}

export interface EmailVerificationTokenPayload {
  accountId: string;
  purpose: "email_verification";
}

// Generate Access Token
export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });
};

// Verify Access Token
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
};

// Generate Refresh Token
export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  // `iat` has second-level precision, so identical payloads can produce identical
  // tokens when refresh tokens are generated within the same second. A unique
  // `jti` ensures every refresh token is distinct for reliable token rotation.
  return jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRY,
    },
  );
};


// Verify Refresh Token
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
};

// Generate Email Verification Token
// Stateless on purpose — no DB write on issue, so sending a second
// (resend) email can never invalidate a still-outstanding first one.
// See docs/known-risks.md for the trade-off this implies.
export const generateEmailVerificationToken = (accountId: string): string => {
  const payload: EmailVerificationTokenPayload = {
    accountId,
    purpose: "email_verification",
  };
  return jwt.sign(payload, env.JWT_EMAIL_VERIFICATION_SECRET, {
    expiresIn: env.JWT_EMAIL_VERIFICATION_EXPIRY,
  });
};

// Verify Email Verification Token
// Uses its own secret (never shared with access/refresh tokens) AND
// checks `purpose` explicitly — belt and suspenders, so a token can't
// be replayed against the wrong endpoint even if secrets were ever
// accidentally reused down the line.
export const verifyEmailVerificationToken = (
  token: string,
): EmailVerificationTokenPayload => {
  const payload = jwt.verify(
    token,
    env.JWT_EMAIL_VERIFICATION_SECRET,
  ) as EmailVerificationTokenPayload;

  if (payload.purpose !== "email_verification") {
    throw new Error("Invalid token purpose");
  }

  return payload;
};
