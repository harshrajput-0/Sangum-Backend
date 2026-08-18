import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { UserRole } from "../modules/users/user.model.js";

export const requireRole = (...allowedRoles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        if(!req.user){
            return next(ApiError.unauthorized());
        }

        if(!allowedRoles.includes(req.user.role)) {
            return next(ApiError.forbidden("You don't have permission to do this"));
        }

        next();
    };
};