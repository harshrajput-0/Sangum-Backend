import { Router } from "express";
import * as authController from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  registerSchema,
  loginSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  tokenParamSchema,
  completeEmailSchema,
} from "./auth.validaton.js";


const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authenticate, authController.logout);
router.post("/refresh-token", authController.refreshToken);




router.post("/forgot-password", validate(forgetPasswordSchema), authController.forgotPassword);

router.post(
  "/reset-password/:token",
  validate(tokenParamSchema, "params"),
  validate(resetPasswordSchema),
  authController.resetPassword,
);

router.get(
  "/verify-email/:token",
  validate(tokenParamSchema, "params"),
  authController.verifyEmail,
);

router.post("/resend-verification", authenticate, authController.resendVerification);

router.post(
  "/complete-email",
  authenticate,
  validate(completeEmailSchema),
  authController.completeEmail,
);


// ====[ OAuth Authenticatioin]------------------------------------------
router.get("/oauth/:provider", authController.oauthRedirect);
router.get("/oauth/:provider/callback", authController.oauthCallback);

export default router;