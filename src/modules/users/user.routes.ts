import { Request, Response, NextFunction, Router } from "express";
import * as userController from "./user.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { onboardingSchema } from "./user.validation.js";
import { uploadAvatar } from "../../config/multer.js";
import ApiError from "../../utils/ApiError.js";

const router = Router();

const handleAvatarUpload = (req: Request, res: Response, next: NextFunction) => {
    uploadAvatar.single("avatar")(req, res, (err: unknown) => {
        if (err) {
            const message = err instanceof Error ? err.message : "Invalid file upload";
            return next(ApiError.badRequest(message));
        }


        req.body = req.body ?? {};
        next();
    });
};



router.post("/onboarding", authenticate, handleAvatarUpload, validate(onboardingSchema), userController.completeOnboarding);

export default router;