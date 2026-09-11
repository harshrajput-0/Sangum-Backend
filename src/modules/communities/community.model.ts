import mongoose, { Document, Schema, Types } from "mongoose";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum CommunityType {
  PUBLIC = "public",         // anyone can view and join
  RESTRICTED = "restricted", // anyone can view, request to join
  PRIVATE = "private",       // invite only
}

export enum CommunityCategory {
  TECHNOLOGY = "technology",
  SCIENCE = "science",
  DESIGN = "design",
  BUSINESS = "business",
  EDUCATION = "education",
  GAMING = "gaming",
  CREATIVE = "creative",
  CAREER = "career",
  HEALTH = "health",
  OTHER = "other",
}

// ─── Sub-document Interfaces ──────────────────────────────────────────────────

export interface ICommunityRule {
  title: string;
  description: string;
  order: number;
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface ICommunity extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  avatar?: string;
  banner?: string;
  createdBy: Types.ObjectId;
  type: CommunityType;
  category: CommunityCategory;
  tags: Types.ObjectId[];
  rules: ICommunityRule[];
  membersCount: number;
  postsCount: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const communityRuleSchema = new Schema<ICommunityRule>(
  {
    title: {
      type: String,
      required: true,
      maxlength: [100, "Rule title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: true,
      maxlength: [500, "Rule description cannot exceed 500 characters"],
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const communitySchema = new Schema<ICommunity>(
  {
    name: {
      type: String,
      required: [true, "Community name is required"],
      trim: true,
      minlength: [3, "Community name must be at least 3 characters"],
      maxlength: [50, "Community name cannot exceed 50 characters"],
    },

    slug: {
      type: String,
      required: [true, "Community slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      required: [true, "Community description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    shortDescription: {
      type: String,
      maxlength: [160, "Short description cannot exceed 160 characters"],
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },

    banner: {
      type: String,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: Object.values(CommunityType),
      default: CommunityType.PUBLIC,
    },

    category: {
      type: String,
      enum: Object.values(CommunityCategory),
      required: [true, "Community category is required"],
    },

    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],

    rules: {
      type: [communityRuleSchema],
      default: [],
      validate: {
        validator: (rules: ICommunityRule[]) => rules.length <= 15,
        message: "A community cannot have more than 15 rules",
      },
    },

    membersCount: {
      type: Number,
      default: 1, // creator is the first member
      min: 0,
    },

    postsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "communities",
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

communitySchema.index({ name: "text", description: "text" });
communitySchema.index({ category: 1, membersCount: -1 });
communitySchema.index({ isActive: 1, type: 1 });
communitySchema.index({ tags: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Community = mongoose.model<ICommunity>("Community", communitySchema);

export default Community;
