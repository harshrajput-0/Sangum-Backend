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

import { authRateLimit } from "../../middlewares/rateLimit.middleware.js";


const router = Router();

router.post("/register", authRateLimit, validate(registerSchema), authController.register);
router.post("/login", authRateLimit, validate(loginSchema), authController.login);
router.post("/logout", authRateLimit, authenticate, authController.logout);
router.post("/refresh-token", authRateLimit, authController.refreshToken);




router.post("/forgot-password", authRateLimit,validate(forgetPasswordSchema), authController.forgotPassword);

router.post(
  "/reset-password/:token",
  authRateLimit,
  validate(tokenParamSchema, "params"),
  validate(resetPasswordSchema),
  authController.resetPassword,
);

router.post(
  "/verify-email/:token",
  authRateLimit,
  validate(tokenParamSchema, "params"),
  authController.verifyEmail,
);

router.post(
  "/resend-verification",
  authRateLimit,
  authenticate,
  authController.resendVerification,
);

router.get("/me", authenticate, authController.getMe);

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