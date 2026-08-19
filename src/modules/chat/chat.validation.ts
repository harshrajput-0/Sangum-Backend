import { z } from "zod";
import { MessageType } from "./message.model.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * HOW THESE SCHEMAS ARE USED
 * ─────────────────────────────────────────────────────────────────────────
 * Same pattern as auth.validation.ts — passed to the validate() middleware
 * in chat.routes.ts.
 * ─────────────────────────────────────────────────────────────────────────
 */

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

export const createDirectConversationSchema = z.object({
  userId: objectIdRule,
});

export const createGroupConversationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name is required")
    .max(100, "Group name cannot exceed 100 characters"),
  participantIds: z
    .array(objectIdRule)
    .min(1, "A group needs at least one other participant")
    .max(99, "A group cannot have more than 100 participants (including you)"),
  avatar: z.string().trim().url("Must be a valid URL").optional(),
});

// refine() ensures exactly one of content/media is present per the
// message type — a TEXT message needs content, an IMAGE/FILE message
// needs media. SYSTEM messages are server-generated only (e.g. "X joined
// the group") and never created through this schema.
export const sendMessageSchema = z
  .object({
    type: z.nativeEnum(MessageType).refine((t) => t !== MessageType.SYSTEM, {
      message: "System messages can't be created directly",
    }),
    content: z.string().trim().max(5000, "Message cannot exceed 5000 characters").optional(),
    media: objectIdRule.optional(),
    replyTo: objectIdRule.optional(),
  })
  .refine((data) => data.type !== MessageType.TEXT || !!data.content, {
    message: "content is required for text messages",
    path: ["content"],
  })
  .refine(
    (data) => (data.type !== MessageType.IMAGE && data.type !== MessageType.FILE) || !!data.media,
    { message: "media is required for image/file messages", path: ["media"] }
  );

export const editMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(5000, "Message cannot exceed 5000 characters"),
});

export const addParticipantsSchema = z.object({
  userIds: z
    .array(objectIdRule)
    .min(1, "Provide at least one user to add")
    .max(50, "Cannot add more than 50 participants at once"),
});

export const muteConversationSchema = z.object({
  durationHours: z
    .number({ error: "durationHours must be a number" })
    .positive("durationHours must be greater than 0")
    .max(24 * 365, "durationHours cannot exceed one year")
    .optional(),
});

export const conversationIdParamSchema = z.object({
  conversationId: objectIdRule,
});

export const messageIdParamSchema = z.object({
  messageId: objectIdRule,
});

export const conversationParticipantParamSchema = z.object({
  conversationId: objectIdRule,
  userId: objectIdRule,
});

export const listConversationsQuerySchema = z.object(paginationShape);
export const listMessagesQuerySchema = z.object(paginationShape);
