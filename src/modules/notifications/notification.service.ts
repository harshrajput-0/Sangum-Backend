import * as notificationRepository from "./notification.repository.js";
import { ApiError } from "../../utils/ApiError.js";
import { buildPaginationMeta } from "../../utils/pagination.js";
import {
  CreateNotificationPayload,
  NotificationResponse,
  PaginatedNotifications,
} from "./notification.types.js";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * NOTIFICATIONS SERVICE
 * ═══════════════════════════════════════════════════════════════════════
 * Same layering rule as auth.service.ts.
 *
 * NOT WIRED UP YET, same honest-gap pattern as every other module's
 * "exposed for future use" cross-module functions: createNotification
 * below is ready to be called, but nothing in Follow/Reactions/Community/
 * Post/Chat actually calls it yet — those modules were built before or
 * without this integration. Wiring it up means adding a single
 * `await notificationService.createNotification({...})` call at each
 * relevant action site (e.g. followUser in follow.service.ts, react() in
 * postReaction.service.ts, approveJoinRequest in community.service.ts),
 * building the `message` string there using data that function already
 * has in hand. Deliberately not done blind in this pass — each call site
 * needs its own sensible message copy, not a generic template.
 * ═══════════════════════════════════════════════════════════════════════
 */

const toNotificationResponse = (notification: any): NotificationResponse => ({
  _id: notification._id.toString(),
  sender: notification.senderId
    ? {
        _id: notification.senderId._id.toString(),
        username: notification.senderId.username,
        displayName: notification.senderId.displayName,
        avatar: notification.senderId.avatar ?? null,
      }
    : null,
  type: notification.type,
  targetId: notification.targetId ? notification.targetId.toString() : null,
  targetType: notification.targetType ?? null,
  message: notification.message,
  isRead: notification.isRead,
  readAt: notification.readAt ?? null,
  createdAt: notification.createdAt,
});

/**
 * Silently no-ops when recipientId === senderId — acting on your own
 * content (reacting to your own post, etc.) shouldn't notify you about
 * yourself. Every future call site gets this guard for free rather than
 * needing to remember to check it themselves.
 */
export const createNotification = async (
  payload: CreateNotificationPayload,
): Promise<void> => {
  if (payload.senderId && payload.senderId === payload.recipientId) {
    return;
  }

  const data: Record<string, unknown> = {
    recipientId: payload.recipientId,
    type: payload.type,
    message: payload.message,
  };
  if (payload.senderId) data.senderId = payload.senderId;
  if (payload.targetId) data.targetId = payload.targetId;
  if (payload.targetType) data.targetType = payload.targetType;

  await notificationRepository.createNotification(data as any);
};

export const listMyNotifications = async (
  userId: string,
  unreadOnly: boolean | undefined,
  page: number,
  limit: number,
): Promise<PaginatedNotifications> => {
  const { notifications, total } = await notificationRepository.listForUser(
    userId,
    unreadOnly,
    page,
    limit,
  );

  return {
    notifications: notifications.map(toNotificationResponse),
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  return notificationRepository.countUnread(userId);
};

export const markAsRead = async (
  notificationId: string,
  userId: string,
): Promise<void> => {
  const existing = await notificationRepository.findByIdRaw(notificationId);
  if (!existing) throw ApiError.notFound("Notification not found");
  if (existing.recipientId.toString() !== userId) {
    throw ApiError.forbidden("This isn't your notification");
  }

  await notificationRepository.markAsRead(notificationId);
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  await notificationRepository.markAllAsRead(userId);
};

export const deleteNotification = async (
  notificationId: string,
  userId: string,
): Promise<void> => {
  const existing = await notificationRepository.findByIdRaw(notificationId);
  if (!existing) throw ApiError.notFound("Notification not found");
  if (existing.recipientId.toString() !== userId) {
    throw ApiError.forbidden("This isn't your notification");
  }

  await notificationRepository.deleteById(notificationId);
};
