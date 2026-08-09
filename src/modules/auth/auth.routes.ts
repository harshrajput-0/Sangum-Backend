import { Router } from "express";
import * as authController from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { registerSchema, loginSchema } from "./auth.validaton.js";


const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authenticate, authController.logout);
router.post("/refresh-token", authController.refreshToken);


// ====[ OAuth Authenticatioin]------------------------------------------
router.get("/oauth/:provider", authController.oauthRedirect);
router.get("/oauth/:provider/callback", authController.oauthCallback);

export default router;