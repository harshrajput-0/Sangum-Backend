import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import { verifyAccessToken } from "../utils/generateTokens";
import { logger } from "../utils/logger";


export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const [schema, token] = authHeader?.split(" ") ?? [];

    if(schema !== "Bearer" || !token){
        return next(ApiError.unauthorized("No access token provided"));
    };

    try {
        req.user = verifyAccessToken(token);
        next()
    } catch (error) {
        logger.debug("Token Verification failed", {error})
        next(ApiError.unauthorized("Invalid or expired access token"))
    };

};

