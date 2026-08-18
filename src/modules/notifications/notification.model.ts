import mongoose, { Document, Schema, Types } from "mongoose";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum NotificationType {
  // Social
  FOLLOW            = "follow",
  // Posts
  POST_REACTION     = "post_reaction",
  POST_COMMENT      = "post_comment",
  POST_MENTION      = "post_mention",
  // Comments
  COMMENT_REACTION  = "comment_reaction",
  COMMENT_REPLY     = "comment_reply",
  COMMENT_MENTION   = "comment_mention",
  // Communities
  COMMUNITY_INVITE  = "community_invite",
  COMMUNITY_JOIN    = "community_join",
  JOIN_REQUEST      = "join_request",
  JOIN_APPROVED     = "join_approved",
  JOIN_REJECTED     = "join_rejected",
  // Resources
  RESOURCE_APPROVED = "resource_approved",
  RESOURCE_REJECTED = "resource_rejected",
  // Moderation
  POST_REMOVED      = "post_removed",
  COMMENT_REMOVED   = "comment_removed",
  MEMBER_BANNED     = "member_banned",
}

export enum NotificationTargetType {
  POST        = "post",
  COMMENT     = "comment",
  COMMUNITY   = "community",
  USER        = "user",
  RESOURCE    = "resource",
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipientId: Types.ObjectId;
  senderId?: Types.ObjectId;       // null for system notifications
  type: NotificationType;
  targetId?: Types.ObjectId;       // the entity the notification is about
  targetType?: NotificationTargetType;
  message: string;                 // pre-rendered human-readable string
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: [true, "Notification type is required"],
    },

    targetId: {
      type: Schema.Types.ObjectId,
      default: null,
    },

    targetType: {
      type: String,
      enum: Object.values(NotificationTargetType),
      default: null,
    },

    message: {
      type: String,
      required: [true, "Notification message is required"],
      maxlength: [500, "Notification message cannot exceed 500 characters"],
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "notifications",
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, type: 1 });
// Auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default Notification;
