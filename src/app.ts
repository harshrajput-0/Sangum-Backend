import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { Request, Response, NextFunction } from "express";

import { ApiError } from "./utils/ApiError.js";

import authRoutes from "./modules/auth/auth.routes.js";
import contactRoutes from "./modules/contact/contact.routes.js";
import waitlistRountes from "./modules/waitlist/waitlist.routes.js";
import userRoutes from "./modules/users/user.routes.js";

import tagRoutes from "./modules/tags/tag.routes.js"
import notificationRoutes from "./modules/notifications/notification.routes.js"
import followRoutes from "./modules/follows/follow.routes.js"
import mediaRoutes from "./modules/media/media.routes.js"

export const createApp = (): Application => {
  const app = express();

  // Trust Render's reverse proxy so Express can resolve the real client IP
  // from X-Forwarded-For (used by rate limiting and req.ip).
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: false, // All rendering is handle by nextjs, no server rendering
    }),
  );
  app.use(
    cors({
      origin: ["http://localhost:5173", "https://sangum-app.vercel.app"],
      credentials: true, // required for the httpOnly refresh-token cookie to be sent cross-origin
    }),
  );

  app.use(cookieParser());
  app.use(express.json());

  const API_PREFIX = "/api/v1";

  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/users`, userRoutes);


  app.use(`${API_PREFIX}/tags`, tagRoutes);
  app.use(`${API_PREFIX}/media`, mediaRoutes);
  app.use(`${API_PREFIX}/notifications`, notificationRoutes);


  app.use(`${API_PREFIX}/users`, followRoutes); // adds /:userId/follow, /followers, etc.



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
        ...(err.code ? { code: err.code } : {}),
      });
    },
  );
  return app;
};
