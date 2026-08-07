import { z } from "zod";

// Password Validation 
const passwordRule = z
  .string()
  .min(8, "Password must be of at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const completeEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: passwordRule,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Passoword is required"),
});

export const forgetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: passwordRule,
});

export const tokenParamSchema = z.object({
  token: z.string().min(1, "Token is required"),
});
