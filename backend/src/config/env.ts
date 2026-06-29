import {z} from "zod";
import dotenv from "dotenv";
import { StringValue } from "ms";
dotenv.config();


const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    PORT: z.string().default("3000"),
    CLIENT_URL: z.string().url(),

    MONGO_URI: z.string(),


    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be of 32 characters"),
    JWT_ACCESS_EXPIRY: z.custom<StringValue>().default("15m"),

    JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be of 32 characters"),
    JWT_REFRESH_EXPIRY: z.custom<StringValue>().default("7d"),

})


const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
