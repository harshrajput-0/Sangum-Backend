import { z } from "zod";
import { ConversationType } from "./conversation.model.js";

export const createConversationSchema = z.object({
  type: z.nativeEnum(ConversationType),
  participantIds: z.array(z.string().min(1)).min(1),
  name: z.string().trim().max(100).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().max(5000).optional(),
  mediaId: z.string().optional(),
  replyTo: z.string().optional(),
}).refine((data) => data.content || data.mediaId, {
  message: "A message needs either content or a media attachment",
});

export const updateConversationSchema = z.object({
  name: z.string().trim().max(100).optional(),
});
