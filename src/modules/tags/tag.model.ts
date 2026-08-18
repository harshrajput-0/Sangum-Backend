import mongoose, { Document, Schema, Types } from "mongoose";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface ITag extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  color?: string;              // hex color for UI badge
  usageCount: number;          // denormalized — incremented on use
  createdBy: Types.ObjectId;
  isOfficial: boolean;         // admin-created canonical tags
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const tagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: [true, "Tag name is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [2, "Tag name must be at least 2 characters"],
      maxlength: [50, "Tag name cannot exceed 50 characters"],
    },

    slug: {
      type: String,
      required: [true, "Tag slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      maxlength: [200, "Tag description cannot exceed 200 characters"],
      default: null,
    },

    color: {
      type: String,
      match: [/^#([A-Fa-f0-9]{6})$/, "Color must be a valid hex code"],
      default: null,
    },

    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isOfficial: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "tags",
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

tagSchema.index({ name: "text" });
tagSchema.index({ usageCount: -1 });
tagSchema.index({ isOfficial: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Tag = mongoose.model<ITag>("Tag", tagSchema);

export default Tag;
