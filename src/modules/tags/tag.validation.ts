import { z } from "zod";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * HOW THESE SCHEMAS ARE USED
 * ─────────────────────────────────────────────────────────────────────────
 * Same pattern as auth.validation.ts — passed to the validate() middleware
 * in tag.routes.ts.
 * ─────────────────────────────────────────────────────────────────────────
 */

// Mirrors tag.model.ts's color validator exactly
// (match: [/^#([A-Fa-f0-9]{6})$/, ...]) — kept in sync deliberately, same
// reasoning as user.validation.ts's usernameRule mirroring its schema.
const colorRule = z.string().regex(/^#[A-Fa-f0-9]{6}$/, "Color must be a valid hex code (e.g. #6D5DFE)");

export const createTagSchema = z.object({
  name: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Tag name must be at least 2 characters")
    .max(50, "Tag name cannot exceed 50 characters"),
  description: z.string().trim().max(200, "Description cannot exceed 200 characters").optional(),
  color: colorRule.optional(),
});

export const updateTagSchema = z
  .object({
    description: z
      .string()
      .trim()
      .max(200, "Description cannot exceed 200 characters")
      .optional()
      .or(z.literal("")),
    color: colorRule.optional().or(z.literal("")),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const listTagsQuerySchema = z.object({
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
  isOfficial: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
  sort: z.enum(["popular", "newest", "alphabetical"]).optional().default("popular"),
});

export const searchTagsQuerySchema = z.object({
  q: z.string().trim().min(1, "Search query is required").max(100, "Search query is too long"),
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
});

export const tagIdParamSchema = z.object({
  tagId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id format"),
});

export const slugParamSchema = z.object({
  slug: z.string().trim().min(1, "Slug is required"),
});
