import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";


import { env } from "./config/env.js";

import authRoutes from "./modules/auth/auth.routes.js"


export const createApp = (): Application => {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false,        // All rendering is handle by nextjs, no server rendering
  }));
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,              // required for the httpOnly refresh-token cookie to be sent cross-origin
    }),
  );

  app.use(cookieParser());
  app.use(express.json());

  app.use(`/auth`, authRoutes)

  return app;
};

