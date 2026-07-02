import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod/v3";
import ApiError from "../utils/ApiError";

type ValidationTarget = "body" | "params" | "query";

export const validate = (schema: ZodSchema, target: ValidationTarget = "body") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      return next(ApiError.badRequest("Validation failed", errors));
    }

    req[target] = result.data;
    next();
  };
};