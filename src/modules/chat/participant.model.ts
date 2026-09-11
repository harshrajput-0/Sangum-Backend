import mongoose, { Document, Schema, Types } from "mongoose";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ParticipantRole {
  ADMIN = "admin",     // group owner/admin
  MEMBER = "member",
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IParticipant extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: ParticipantRole;
  joinedAt: Date;
  lastRead?: Types.ObjectId;   // last message the user has read
  lastReadAt?: Date;
  isActive: boolean;           // false = left the group
  leftAt?: Date;
  isMuted: boolean;
  mutedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const participantSchema = new Schema<IParticipant>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: Object.values(ParticipantRole),
      default: ParticipantRole.MEMBER,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    lastRead: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    lastReadAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    leftAt: {
      type: Date,
      default: null,
    },

    isMuted: {
      type: Boolean,
      default: false,
    },

    mutedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "participants",
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Enforce one participant record per user per conversation
participantSchema.index(
  { conversationId: 1, userId: 1 },
  { unique: true }
);
participantSchema.index({ userId: 1, isActive: 1, lastReadAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Participant = mongoose.model<IParticipant>("Participant", participantSchema);

export default Participant;
