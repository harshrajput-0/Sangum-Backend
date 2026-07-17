import rateLimit from "express-rate-limit";

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many attempts. Please try again in 15 minutes.",
  },
});
