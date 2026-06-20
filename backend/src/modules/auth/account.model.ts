import mongoose, { Document, Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";

// ===| INTERFACE |────────────────────────────────────────────────────────────────

export interface IAccount extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  email: string;
  password: string;
  isVerified: boolean;
  isActive: boolean;
  refreshToken?: string;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

// ===| Schema |─────────────────────────────────────────────────────────────────

const accountSchema = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
      index: true,
    },

    password: {
      type: String,
      required: [true, "Password is Required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: false,
    },

    refreshToken: {
      type: String,
      select: false,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpiry: {
      type: Date,
      select: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpiry: {
      type: Date,
      select: false,
    },

    lastLogin: {
      type: Date,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "accounts",
  },
);

// ===| Index |────────────────────────────────────────────────────────────────────

// ===| Methods |────────────────────────────────────────────────────────────────────

// ===| Model |────────────────────────────────────────────────────────────────────
const Account = mongoose.model<IAccount>("Account", accountSchema);
export default Account;
