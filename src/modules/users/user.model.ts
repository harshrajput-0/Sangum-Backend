import mongoose, { Document, Schema, Types } from "mongoose";

// ==| ENUM |────────────────────────────────────────────────────────────────

export enum UserRole {
  USER = "user",
  MODERATOR = "moderator",
  ADMIN = "admin",
}

export enum BadgeType {
  EARLY_ADOPTER = "early_adopter",
  TOP_CONTRIBUTOR = "top_contributor",
  VERIFIED = "verified",
  MODERATOR = "moderator",
}

// ===| SUB INTERFACE |────────────────────────────────────────────────────────────────

export interface ISocialLinks {
  github?: string;
  linkedIn?: string;
  twitter?: string;
  website?: string;
  youtube?: string;
}

export interface IBadge {
  types: BadgeType;
  awardedAt: Date;
}

// ===| INTERFACE |────────────────────────────────────────────────────────────────

export interface IUser extends Document {
  _id: Types.ObjectId;
  accountId: Types.ObjectId;
  username: string;
  displayName: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  location?: string;
  socialLinks?: ISocialLinks;
  role: UserRole;
  badges: IBadge[];
  isOnline: boolean;
  lastSeen: Date;
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==| Actual Schema |----------------------------------------------------------

const socialLinksSchema = new Schema<ISocialLinks>(
  {
  github: { type: String, trim: true },
  linkedIn: { type: String, trim: true },
  twitter: { type: String, trim: true },
  website: { type: String, trim: true },
  youtube: { type: String, trim: true },
},
{ _id: false }
);

const badgeSchema = new Schema<IBadge>(
  {
  types: {
    type: String,
    enum: Object.values(BadgeType),
    required: true,
  },
  awardedAt: {
    type: Date,
    default: Date.now(),
  },
},
{ _id: false }
);

const userSchema = new Schema<IUser>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      unique: true,
    },

    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      toLowerCase: true,
      minlength: [5, "Username require at least 5 characters"],
      maxlength: [20, "Username cannot exceed 20 characters"],
      match: [
        /^[a-z0-9_]+$/,
        "Username can only contain lowercase letters, numbers, and underscores",
      ],
      index: true,
    },

    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
      minlength: [2, "Display name must be at least 2 characters"],
      maxlength: [50, "Display name cannot exceed 50 characters"],
    },

    avatar: {
      type: String,
      default: null,
    },

    banner: {
      type: String,
      default: null,
    },

    bio: {
      type: String,
      maxlength: [300, "Bio cannot exceed 300 characters"],
      default: null,
    },

    location: {
      type: String,
      maxlength: [100, "Location cannot exceed 100 characters"],
      default: null,
    },

    socialLinks: {
      type: socialLinksSchema,
      default: () => ({}),
    },

    role: {
      type: String,
      enum: UserRole,
      default: UserRole.USER,
    },

    badges: {
      type: [badgeSchema],
      default: [],
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "users",
  },
);

// ===| Indexes |──────────────────────────────────────────────────────────────────

userSchema.index({ username: "text", displayName: "text" });
userSchema.index({ isOnline: 1, lastSeen: -1 });
userSchema.index({ role: 1 });

// ===| Model |─────────────────────────────────────────────────────────────────

const User = mongoose.model<IUser>("User", userSchema);
export default User;
