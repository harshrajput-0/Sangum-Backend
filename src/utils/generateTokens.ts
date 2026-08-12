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
