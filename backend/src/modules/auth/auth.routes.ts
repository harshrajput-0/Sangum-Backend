import { Router } from "express";
import * as authController from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { registerSchema, loginSchema } from "./auth.validaton";


const router = Router();

router.post("register", validate(registerSchema), authController.register);
router.post("login", validate(loginSchema), authController.login);
router.post("register", authenticate, authController.logout);