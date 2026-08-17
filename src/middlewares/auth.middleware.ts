import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/generateTokens.js";
import { logger } from "../utils/logger.js";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  // Getting the header authorization
  const authHeader = req.headers.authorization;
  const [schema, token] = authHeader?.split(" ") ?? [];

  // split(" ") returns "Bearer", not "Bearer ".
  if (schema !== "Bearer" || !token) {
    return next(ApiError.unauthorized("No access token provided"));
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (error) {
    logger.debug("Token Verification failed", { error });
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
};

// Optional Authenticate
export const optionalAuthenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  // Getting the header authorization
  const authHeader = req.headers.authorization;
  const [schema, token] = authHeader?.split(" ") ?? [];

  // Same fix as authenticate() above — split(" ") returns "Bearer", not
  // "Bearer " with a trailing space. Checking for "Bearer " therefore never
  // matched a valid Authorization header, causing optionalAuthenticate() to
  // silently skip req.user for every request (e.g. GET /users/:username's
  // isOwnProfile).
  if (schema !== "Bearer " || !token) {
    return next();
  }

  try {
    req.user = verifyAccessToken(token);
  } catch (error) {
    logger.debug("Optional token verification failed", { error });
  }

  next();
};
