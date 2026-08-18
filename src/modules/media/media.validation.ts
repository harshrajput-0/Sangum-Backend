import { z } from "zod";
import { MediaType, MediaContext } from "./media.model.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * HOW THESE SCHEMAS ARE USED
 * ─────────────────────────────────────────────────────────────────────────
 * Same pattern as auth.validation.ts — passed to the validate() middleware
 * in media.routes.ts.
 * ─────────────────────────────────────────────────────────────────────────
 */

const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB — a sane server-side
// sanity bound even without a real upload pipeline enforcing it yet; a
// client could otherwise claim any size for a URL it already controls.

// Contexts that are inherently image-only — profile/community imagery.
// POST/RESOURCE/CHAT contexts can legitimately be any media type.
const IMAGE_ONLY_CONTEXTS = new Set([
  MediaContext.AVATAR,
  MediaContext.BANNER,
  MediaContext.COMMUNITY_AVATAR,
  MediaContext.COMMUNITY_BANNER,
]);

export const createMediaSchema = z
  .object({
    url: z.string().trim().url("Must be a valid URL"),
    publicId: z.string().trim().min(1, "publicId is required"),
    type: z.nativeEnum(MediaType, { error: () => ({ message: "Invalid media type" }) }),
    mimeType: z
      .string()
      .trim()
      .regex(/^[a-z]+\/[a-z0-9.+-]+$/i, "Invalid MIME type"),
    size: z
      .number({ error: "size must be a number" })
      .positive("size must be greater than 0")
      .max(MAX_SIZE_BYTES, "File is too large"),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    duration: z.number().positive().optional(),
    altText: z.string().trim().max(200, "Alt text cannot exceed 200 characters").optional(),
    context: z.nativeEnum(MediaContext, { error: () => ({ message: "Invalid media context" }) }),
  })
  .refine((data) => !IMAGE_ONLY_CONTEXTS.has(data.context) || data.type === MediaType.IMAGE, {
    message: "This context requires an image",
    path: ["type"],
  });

export const updateMediaSchema = z.object({
  altText: z.string().trim().max(200, "Alt text cannot exceed 200 characters").optional().or(z.literal("")),
});

export const listMyMediaQuerySchema = z.object({
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
  context: z.nativeEnum(MediaContext).optional(),
  type: z.nativeEnum(MediaType).optional(),
});

export const mediaIdParamSchema = z.object({
  mediaId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id format"),
});
