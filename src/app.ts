import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { Request, Response, NextFunction } from "express";

import { env } from "./config/env.js";

import authRoutes from "./modules/auth/auth.routes.js";
import contactRoutes from "./modules/contact/contact.routes.js";
import waitlistRountes from "./modules/waitlist/waitlist.routes.js";
import ApiError from "./utils/ApiError.js";

export const createApp = (): Application => {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false, // All rendering is handle by nextjs, no server rendering
    }),
  );
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true, // required for the httpOnly refresh-token cookie to be sent cross-origin
    }),
  );

  app.use(cookieParser());
  app.use(express.json());

  app.use(`/auth`, authRoutes);
  app.use("/api", contactRoutes);
  app.use("/api", waitlistRountes);

  // Thrown ApiErrors currently fall through to Express's default HTML error page instead of JSON
  // 👇 Global error handler — catches application errors and returns a JSON response
  app.use(
    (err: ApiError, _req: Request, res: Response, _next: NextFunction) => {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        statusCode,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
      });
    },
  );
  return app;
};
