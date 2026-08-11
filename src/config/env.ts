import { z } from "zod";
import dotenv from "dotenv";
import { StringValue } from "ms";
dotenv.config();

const envSchema = z.object({
  // ==| SERVER |---------------------------------------------------------
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000"),
  CLIENT_URL: z.string().url(),
  API_URL: z.string().url(),

  // ==| DATABASE |--------------------------------------------------------
  MONGO_URI: z.string(),

  // ==| ACCESS TOKEN |-----------------------------------------------------
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be of 32 characters"),
  JWT_ACCESS_EXPIRY: z.custom<StringValue>().default("15m"),

  // ==| REFRESH TOKEN |-----------------------------------------------------
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be of 32 characters"),
  JWT_REFRESH_EXPIRY: z.custom<StringValue>().default("7d"),

  // ==| GOOGLE VARIABLE |-----------------------------------------------------
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string(),

  // ==| GITHUB VARIABLE |------------------------------------------------------
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_CALLBACK_URL: z.string(),

  // ==| LINKEDIN VARIABLE |----------------------------------------------------
  LINKEDIN_CLIENT_ID: z.string().min(1),
  LINKEDIN_CLIENT_SECRET: z.string().min(1),
  LINKEDIN_CALLBACK_URL: z.string().url(),

  // ==| Cloudinary (media uploads) |-----------------------------------------
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  // ==| EMAIL (nodemailer / Gmail) |------------------------------------------
  EMAIL_USER: z.string().email("EMAIL_USER must be a valid email address"),
  EMAIL_PASS: z.string().min(1, "EMAIL_PASS is required"),

});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
