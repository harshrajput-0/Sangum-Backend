import mongoose, { Document, Schema, Types } from "mongoose";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum CommunityMemberRole {
  OWNER = "owner",
  MODERATOR = "moderator",
  MEMBER = "member",
}

export enum MembershipStatus {
  ACTIVE = "active",
  PENDING = "pending",     // for restricted communities awaiting approval
  BANNED = "banned",
  MUTED = "muted",
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface ICommunityMember extends Document {
  _id: Types.ObjectId;
  communityId: Types.ObjectId;
  userId: Types.ObjectId;
  role: CommunityMemberRole;
  status: MembershipStatus;
  joinedAt: Date;
  bannedAt?: Date;
  banReason?: string;
  bannedBy?: Types.ObjectId;
  mutedUntil?: Date;
  muteReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const communityMemberSchema = new Schema<ICommunityMember>(
  {
    communityId: {
      type: Schema.Types.ObjectId,
      ref: "Community",
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
      enum: Object.values(CommunityMemberRole),
      default: CommunityMemberRole.MEMBER,
    },

    status: {
      type: String,
      enum: Object.values(MembershipStatus),
      default: MembershipStatus.ACTIVE,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    bannedAt: {
      type: Date,
      default: null,
    },

    banReason: {
      type: String,
      maxlength: [500, "Ban reason cannot exceed 500 characters"],
      default: null,
    },

    bannedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    mutedUntil: {
      type: Date,
      default: null,
    },

    muteReason: {
      type: String,
      maxlength: [500, "Mute reason cannot exceed 500 characters"],
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "communitymembers",
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Enforce one membership record per user per community
communityMemberSchema.index({ communityId: 1, userId: 1 }, { unique: true });
communityMemberSchema.index({ communityId: 1, role: 1 });
communityMemberSchema.index({ communityId: 1, status: 1 });
communityMemberSchema.index({ userId: 1, status: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const CommunityMember = mongoose.model<ICommunityMember>(
  "CommunityMember",
  communityMemberSchema
);

export default CommunityMember;
