import { ConversationType } from "./conversation.model.js";
import { MessageType } from "./message.model.js";
import { ParticipantRole } from "./participant.model.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * WHY TYPES LIVE IN THEIR OWN FILE
 * ─────────────────────────────────────────────────────────────────────────
 * Same rationale as auth.types.ts — chat.validation.ts (Zod) validates at
 * RUNTIME, this file describes the same shapes for the TypeScript
 * COMPILER, kept explicit for readability rather than z.infer<...>.
 *
 * SCOPE NOTE: this module is the REST layer only — create/list/read
 * conversations and messages over HTTP. Real-time delivery (typing
 * indicators, live message push, presence) is the sockets layer, which
 * PROJECT_STATE.md explicitly scopes as a separate follow-up once this
 * REST backend exists. Nothing here assumes a socket connection.
 * ─────────────────────────────────────────────────────────────────────────
 */

// ── Request payloads ─────────────────────────────────────────────────────

export interface CreateDirectConversationPayload {
  userId: string; // the other participant
}

export interface CreateGroupConversationPayload {
  name: string;
  participantIds: string[]; // NOT including the creator — added automatically as ADMIN
  avatar?: string;
}

export interface SendMessagePayload {
  type: MessageType;
  content?: string;
  media?: string;
  replyTo?: string;
}

export interface EditMessagePayload {
  content: string;
}

export interface AddParticipantsPayload {
  userIds: string[];
}

export interface MuteConversationPayload {
  durationHours?: number; // omitted = mute indefinitely
}

export interface ListConversationsQuery {
  page: number;
  limit: number;
}

export interface ListMessagesQuery {
  page: number;
  limit: number;
}

// ── Response shapes ──────────────────────────────────────────────────────

export interface ParticipantUserSummary {
  _id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

export interface ParticipantSummary {
  user: ParticipantUserSummary;
  role: ParticipantRole;
  isActive: boolean;
  isMuted: boolean;
  lastReadAt: Date | null;
}

export interface MessageSenderSummary {
  _id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

export interface MessageResponse {
  _id: string;
  conversationId: string;
  sender: MessageSenderSummary;
  type: MessageType;
  content: string | null;
  media: string | null;
  replyTo: string | null;
  readBy: { userId: string; readAt: Date }[];
  isEdited: boolean;
  editedAt: Date | null;
  createdAt: Date;
}

export interface ConversationResponse {
  _id: string;
  type: ConversationType;
  name: string | null;
  avatar: string | null;
  createdBy: string;
  lastMessage: MessageResponse | null;
  lastMessageAt: Date | null;
  participantsCount: number;
  participants: ParticipantSummary[];
  viewerParticipant: {
    role: ParticipantRole;
    isMuted: boolean;
    lastReadAt: Date | null;
    hasUnread: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

/** Lighter shape for the conversation list — no full participant roster,
 *  matches the CommunitySummary / UserSummary pattern already established
 *  elsewhere for list endpoints vs. single-resource detail endpoints. For
 *  a DIRECT conversation, `name`/`avatar` are the OTHER participant's
 *  displayName/avatar (resolved server-side) rather than null, since a
 *  1:1 chat has no conversation-level name of its own to show in a list. */
export interface ConversationSummary {
  _id: string;
  type: ConversationType;
  name: string | null;
  avatar: string | null;
  lastMessage: MessageResponse | null;
  lastMessageAt: Date | null;
  participantsCount: number;
  hasUnread: boolean;
}

export interface PaginationMetaResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedConversations {
  conversations: ConversationSummary[];
  pagination: PaginationMetaResponse;
}

export interface PaginatedMessages {
  messages: MessageResponse[];
  pagination: PaginationMetaResponse;
}
