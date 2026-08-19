import mongoose, { Document, Schema, Types } from "mongoose";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ConversationType {
  DIRECT = "direct",
  GROUP = "group",
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IConversation extends Document {
  _id: Types.ObjectId;
  type: ConversationType;
  name?: string;               // group chat name
  avatar?: string;             // group chat avatar
  createdBy: Types.ObjectId;
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  participantsCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const conversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: Object.values(ConversationType),
      required: [true, "Conversation type is required"],
    },

    name: {
      type: String,
      trim: true,
      maxlength: [100, "Group name cannot exceed 100 characters"],
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },

    participantsCount: {
      type: Number,
      default: 2,
      min: 2,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "conversations",
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

conversationSchema.index({ createdBy: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ type: 1, isActive: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Conversation = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);

export default Conversation;
