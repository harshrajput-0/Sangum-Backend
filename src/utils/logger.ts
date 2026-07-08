import winston from "winston";
import { env } from "../config/env";

const isProduction = env.NODE_ENV === "production";

export const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    isProduction ? winston.format.json() : winston.format.simple(),
  ),

  transports: isProduction
    ? [
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
        new winston.transports.File({ filename: "logs/combined.log" }),
      ]
    : [new winston.transports.Console()],
});
