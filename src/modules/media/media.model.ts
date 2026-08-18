import mongoose, { Document, Schema, Types } from "mongoose";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  DOCUMENT = "document",
  AUDIO = "audio",
}

export enum MediaContext {
  AVATAR = "avatar",
  BANNER = "banner",
  POST = "post",
  RESOURCE = "resource",
  COMMUNITY_AVATAR = "community_avatar",
  COMMUNITY_BANNER = "community_banner",
  CHAT = "chat",
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IMedia extends Document {
  _id: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  url: string;
  publicId: string;            // Cloudinary public_id
  type: MediaType;
  mimeType: string;
  size: number;                // in bytes
  width?: number;              // image/video
  height?: number;             // image/video
  duration?: number;           // video/audio in seconds
  altText?: string;
  context: MediaContext;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const mediaSchema = new Schema<IMedia>(
  {
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    url: {
      type: String,
      required: [true, "Media URL is required"],
    },

    publicId: {
      type: String,
      required: [true, "Cloudinary public ID is required"],
      unique: true,
    },

    type: {
      type: String,
      enum: Object.values(MediaType),
      required: [true, "Media type is required"],
    },

    mimeType: {
      type: String,
      required: [true, "MIME type is required"],
    },

    size: {
      type: Number,
      required: [true, "File size is required"],
      min: 0,
    },

    width: {
      type: Number,
      default: null,
    },

    height: {
      type: Number,
      default: null,
    },

    duration: {
      type: Number,
      default: null,
    },

    altText: {
      type: String,
      maxlength: [200, "Alt text cannot exceed 200 characters"],
      default: null,
    },

    context: {
      type: String,
      enum: Object.values(MediaContext),
      required: [true, "Media context is required"],
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "media",
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

mediaSchema.index({ uploadedBy: 1, context: 1 });
mediaSchema.index({ type: 1 });
mediaSchema.index({ isDeleted: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Media = mongoose.model<IMedia>("Media", mediaSchema);

export default Media;
