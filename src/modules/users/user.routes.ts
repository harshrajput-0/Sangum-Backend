import { Request, Response, NextFunction, Router } from "express";
import * as userController from "./user.controller.js";
import { authenticate, optionalAuthenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { onboardingSchema, updateProfileSchema, usernameParamSchema} from "./user.validation.js";
import { uploadAvatar, uploadCover } from "../../config/multer.js";
import ApiError from "../../utils/ApiError.js";

const router = Router();








const handleSingleUpload = (uploader: typeof uploadAvatar, fieldName: string) =>
    (req: Request, res: Response, next: NextFunction) => {
        uploader.single(fieldName)(req, res, (err: unknown) => {
            if (err) {
                const message = err instanceof Error ? err.message : "Invalid file upload";
                return next(ApiError.badRequest(message));
            }

            req.body = req.body ?? {};
            next();
        });
    };

const handleAvatarUpload = handleSingleUpload(uploadAvatar, "avatar");
const handleCoverUpload = handleSingleUpload(uploadCover, "cover");

router.post("/onboarding", authenticate, handleAvatarUpload, validate(onboardingSchema), userController.completeOnboarding);

// ===[ Profile ]---------------------------------------------------------------------------------------

router.patch("/profile", authenticate, validate(updateProfileSchema), userController.updateProfile);
router.post("/profile/avatar", authenticate, handleAvatarUpload, userController.uploadAvatar);
router.post("/profile/cover", authenticate, handleCoverUpload, userController.uploadCover);


router.get("/:username", optionalAuthenticate, validate(usernameParamSchema, "params"), userController.getProfile);

export default router;