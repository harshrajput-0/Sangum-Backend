import mongoose, { Document, Schema, Types } from "mongoose";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  FILE = "file",
  SYSTEM = "system",   // e.g. "User X joined the group"
}

// ─── Sub-document Interfaces ──────────────────────────────────────────────────

export interface IReadReceipt {
  userId: Types.ObjectId;
  readAt: Date;
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  type: MessageType;
  content?: string;
  media?: Types.ObjectId;        // ref to Media for image/file messages
  replyTo?: Types.ObjectId;      // ref to Message being replied to
  readBy: IReadReceipt[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const readReceiptSchema = new Schema<IReadReceipt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
);

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: Object.values(MessageType),
      required: [true, "Message type is required"],
      default: MessageType.TEXT,
    },

    content: {
      type: String,
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
      default: null,
    },

    media: {
      type: Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },

    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    readBy: {
      type: [readReceiptSchema],
      default: [],
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "messages",
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, isDeleted: 1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Message = mongoose.model<IMessage>("Message", messageSchema);

export default Message;
