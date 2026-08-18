import { NotificationType, NotificationTargetType } from "./notification.model.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * WHY createNotification TAKES A PRE-BUILT `message` STRING
 * ─────────────────────────────────────────────────────────────────────────
 * notification.model.ts's own comment describes `message` as
 * "pre-rendered human-readable string" — the CALLING code (whichever
 * module triggers a notification: Follow on a new follow, Reactions on a
 * new like, Community on a join approval) builds the actual text using
 * data it already has in hand at that moment (the actor's displayName,
 * etc.). This module deliberately does NOT try to fetch sender info or
 * template messages itself — that would mean importing from every other
 * module's repository just to format a string, the exact kind of
 * sprawling cross-module coupling worth avoiding. See
 * notification.service.ts's header comment for the full reasoning and
 * what "wiring this up" from other modules actually looks like.
 * ─────────────────────────────────────────────────────────────────────────
 */

// ── Request payloads ─────────────────────────────────────────────────────

export interface CreateNotificationPayload {
  recipientId: string;
  senderId?: string;
  type: NotificationType;
  targetId?: string;
  targetType?: NotificationTargetType;
  message: string;
}

export interface ListNotificationsQuery {
  page: number;
  limit: number;
  unreadOnly?: boolean;
}

// ── Response shapes ──────────────────────────────────────────────────────

export interface NotificationSenderSummary {
  _id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

export interface NotificationResponse {
  _id: string;
  sender: NotificationSenderSummary | null;
  type: NotificationType;
  targetId: string | null;
  targetType: NotificationTargetType | null;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface PaginationMetaResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedNotifications {
  notifications: NotificationResponse[];
  pagination: PaginationMetaResponse;
}
