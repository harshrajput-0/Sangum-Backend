import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

// Accepted tradeoff for now: keep strict rate limiting on refresh-token/logout
// as a pre-launch default. The shared-IP/NAT risk is understood. If real users
// experience involuntary logouts, split refresh-token into a more generous
// limiter instead of removing rate limiting entirely.
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test", // 👈 don't let tests trip the real limiter
  message: {
    success: false,
    statusCode: 429,
    message: "Too many attempts. Please try again in 15 minutes.",
  },
});
