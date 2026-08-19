import mongoose, { Document, Schema, Types } from "mongoose";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ResourceType {
  ARTICLE = "article",
  VIDEO = "video",
  COURSE = "course",
  BOOK = "book",
  TOOL = "tool",
  PAPER = "paper",
  PODCAST = "podcast",
  REPO = "repo",
  OTHER = "other",
}

export enum ResourceStatus {
  PENDING = "pending",     // awaiting moderator approval
  APPROVED = "approved",
  REJECTED = "rejected",
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IResource extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  url: string;
  type: ResourceType;
  status: ResourceStatus;
  thumbnail?: string;
  submittedBy: Types.ObjectId;
  communityId?: Types.ObjectId;   // optional community context
  tags: Types.ObjectId[];
  isPaywalled: boolean;
  isFeatured: boolean;
  viewsCount: number;
  bookmarksCount: number;
  reviewedBy?: Types.ObjectId;
  reviewNote?: string;
  reviewedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const resourceSchema = new Schema<IResource>(
  {
    title: {
      type: String,
      required: [true, "Resource title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      required: [true, "Resource description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    url: {
      type: String,
      required: [true, "Resource URL is required"],
      trim: true,
    },

    type: {
      type: String,
      enum: Object.values(ResourceType),
      required: [true, "Resource type is required"],
    },

    status: {
      type: String,
      enum: Object.values(ResourceStatus),
      default: ResourceStatus.PENDING,
      index: true,
    },

    thumbnail: {
      type: String,
      default: null,
    },

    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    communityId: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      default: null,
      index: true,
    },

    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],

    isPaywalled: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    bookmarksCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewNote: {
      type: String,
      maxlength: [500, "Review note cannot exceed 500 characters"],
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "resources",
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

resourceSchema.index({ title: "text", description: "text" });
resourceSchema.index({ status: 1, type: 1, createdAt: -1 });
resourceSchema.index({ tags: 1, status: 1 });
resourceSchema.index({ isFeatured: 1, status: 1 });
resourceSchema.index({ communityId: 1, status: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Resource = mongoose.model<IResource>("Resource", resourceSchema);

export default Resource;
