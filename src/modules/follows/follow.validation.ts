import { z } from "zod";

const objectIdRule = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id format");

const paginationShape = {
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
};

export const userIdParamSchema = z.object({
  userId: objectIdRule,
});

export const listFollowersQuerySchema = z.object(paginationShape);
export const listFollowingQuerySchema = z.object(paginationShape);
