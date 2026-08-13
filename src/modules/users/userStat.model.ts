import mongoose, { Document, Schema, Types } from "mongoose";
// import { IUser } from "./user.model";

// ===| Interface |────────────────────────────────────────────────────────────────
export interface IUserStat {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  postCount: number;
  commentCount: number;
  resourceCount: number;
  followerCount: number;
  followingCount: number;
  reactionReceived: number;
  reactionGiven: number;
  bookmarkCount: number;
  reputationScore: number;
  communitiesJoined: number;
  createdAt: Date;
  updatedAt: Date;
}

// ===| Schema |─────────────────────────────────────────────────────────────────

const userStatsSchema = new Schema<IUserStat>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    postCount: {
      type: Number,
      default: 0,
      min: 0    // avoid negative value
    },

    commentCount: {
      type: Number,
      default: 0,
      min: 0    // avoid negative value
    },

    resourceCount: {
      type: Number,
      default: 0,
      min: 0    // avoid negative value
    },

    followerCount: {
      type: Number,
      default: 0,
      min: 0    // avoid negative value
    },

    followingCount: {
      type: Number,
      default: 0,
      min: 0    // avoid negative value
    },

    reactionReceived: {
      type: Number,
      default: 0,
      min: 0    // avoid negative value
    },

    reactionGiven: {
      type: Number,
      default: 0,
      min: 0    // avoid negative value
    },

    bookmarkCount: {
      type: Number,
      default: 0,
      min: 0    // avoid negative value
    },

    // Calculated from posts + comments quality signals
    reputationScore: {
      type: Number,
      default: 0,
      min: 0    // avoid negative value
    },

    communitiesJoined: {
      type: Number,
      default: 0,
      min: 0    // avoid negative value
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "userstats",
  },
);

// ===| Indexes |──────────────────────────────────────────────────────────────────

userStatsSchema.index({ reputationScore: -1 });
userStatsSchema.index({ followersCount: -1 });

// ===| Model |─────────────────────────────────────────────────────────────────

const UserStats = mongoose.model<IUserStat>("UserStats", userStatsSchema);
export default UserStats;
