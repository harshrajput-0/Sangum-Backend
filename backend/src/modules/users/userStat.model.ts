import mongoose, { Document, Schema, Types } from "mongoose";
import { IUser } from "./user.model";

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

const userStatSchema = new Schema<IUserStat>({
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
  },

  commentCount: {
    type: Number,
    default: 0,
  },

  resourceCount: {
    type: Number,
    default: 0,
  },

  followerCount: {
    type: Number,
    default: 0,
  },
  followingCount: {
    type: Number,
    default: 0,
  },

  reactionReceived: {
    type: Number,
    default: 0,
  },

  reactionGiven: {
    type: Number,
    default: 0,
  },
  bookmarkCount: {
    type: Number,
    default: 0,
  },

  reputationScore: {
    type: Number,
    default: 0,
  },

  communitiesJoined: {
    type: Number,
    default: 0,
  },
},
{
    timestamps: true,
    versionKey: false,
    collection: "userstats"
});




// ===| Model |─────────────────────────────────────────────────────────────────
const UserStats = mongoose.model<IUserStat>("UserStats", userStatSchema);

export default UserStats;