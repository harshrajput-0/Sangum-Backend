import { z } from "zod";

const objectIdRule = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id format");

export const listNotificationsQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, "Page must be a positive integer")
    .optional()
    .default("1")
    .transform((val) => Math.max(Number(val), 1)),
  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be a positive integer")
    .optional()
    .default("20")
    .transform((val) => Math.min(Math.max(Number(val), 1), 50)),
  unreadOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
});

export const notificationIdParamSchema = z.object({
  notificationId: objectIdRule,
});
