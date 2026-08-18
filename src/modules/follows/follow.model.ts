import mongoose, { Document, Schema, Types } from "mongoose";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IFollow extends Document {
  _id: Types.ObjectId;
  followerId: Types.ObjectId;   // the user who is following
  followingId: Types.ObjectId;  // the user being followed
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const followSchema = new Schema<IFollow>(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    followingId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "follows",
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Prevent duplicate follows
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
followSchema.index({ followingId: 1, createdAt: -1 });
followSchema.index({ followerId: 1, createdAt: -1 });

// ─── Pre-save validation ──────────────────────────────────────────────────────

followSchema.pre("save", function () {
  if (this.followerId.equals(this.followingId)) {
    throw new Error("Users cannot follow themselves");
  }
});

// ─── Model ────────────────────────────────────────────────────────────────────

const Follow = mongoose.model<IFollow>("Follow", followSchema);

export default Follow;
