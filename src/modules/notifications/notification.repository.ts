import Notification, { INotification } from "./notification.model.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * THE ONE RULE FOR THIS FILE
 * ─────────────────────────────────────────────────────────────────────────
 * No business logic — just DB queries. notification.service.ts is the
 * only file that imports from here.
 * ─────────────────────────────────────────────────────────────────────────
 */

const POPULATE_SENDER = { path: "senderId", select: "username displayName avatar" };

export const createNotification = (data: Partial<INotification>) => {
  return Notification.create(data);
};

export const findByIdRaw = (notificationId: string) => {
  return Notification.findById(notificationId);
};

export const listForUser = async (
  userId: string,
  unreadOnly: boolean | undefined,
  page: number,
  limit: number
): Promise<{ notifications: INotification[]; total: number }> => {
  const filter: Record<string, unknown> = { recipientId: userId };
  if (unreadOnly) filter.isRead = false;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE_SENDER),
    Notification.countDocuments(filter),
  ]);

  return { notifications, total };
};

export const countUnread = (userId: string) => {
  return Notification.countDocuments({ recipientId: userId, isRead: false });
};

export const markAsRead = (notificationId: string) => {
  return Notification.findByIdAndUpdate(notificationId, {
    $set: { isRead: true, readAt: new Date() },
  });
};

export const markAllAsRead = (userId: string) => {
  return Notification.updateMany(
    { recipientId: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

export const deleteById = (notificationId: string) => {
  return Notification.findByIdAndDelete(notificationId);
};
