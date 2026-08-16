import { z } from "zod";
import {
  USERNAME_REGEX,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_RULE_MESSAGE,
} from "../../utils/username.js";

// Password Validation 
const passwordRule = z
  .string()
  .min(8, "Password must be of at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Same rule used by user.model.ts and user.validation.ts's onboardingSchema
// — see utils/username.ts for why this lives in one place.
const usernameRule = z
  .string()
  .trim()
  .toLowerCase()
  .min(USERNAME_MIN_LENGTH, `Username require at least ${USERNAME_MIN_LENGTH} characters`)
  .max(USERNAME_MAX_LENGTH, `Username cannot exceed ${USERNAME_MAX_LENGTH} characters`)
  .regex(USERNAME_REGEX, USERNAME_RULE_MESSAGE);

export const completeEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: passwordRule,
  username: usernameRule,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Passoword is required"),
});

export const forgetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  // token: z.string(),
  newPassword: passwordRule,
});

export const tokenParamSchema = z.object({
  token: z.string().min(1, "Token is required"),
});
