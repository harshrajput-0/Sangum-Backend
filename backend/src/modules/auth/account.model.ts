import mongoose, { Document, Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";

// ===| ENUMS |────────────────────────────────────────────────────────────────
export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
  GITHUB = "github",
  LINKEDIN = "linkedin",
}

// ===| INTERFACE |────────────────────────────────────────────────────────────────

export interface IOAuthProvider {
  provider: AuthProvider;
  providerId: string;
  connectedAt: Date;
}

export interface IAccount extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  email?: string;
  password?: string; // Because OAuth accounts don't have password
  authProviders: IOAuthProvider;

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
  // Added for oauth system
  hasProvider(provider: AuthProvider): boolean;
  needEmail(): boolean;

  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

// ===| Schema |─────────────────────────────────────────────────────────────────
const oAuthProviderSchema = new Schema<IOAuthProvider>(
  {
    provider: {
      type: String,
      enum: Object.values(AuthProvider),
      required: true,
    },
    providerId: {
      type: String,
      required: true,
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

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
      // required: [true, "Email is required"],
      // unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
      // index: true,
      default: null,
    },

    password: {
      type: String,
      // required: [true, "Password is Required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
      default: null,
    },

    authProviders: [oAuthProviderSchema],

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
      default: null,
    },

    passwordResetToken: {
      type: String,
      select: false,
      default: null,
    },

    passwordResetExpiry: {
      type: Date,
      select: false,
      default: null,
    },

    emailVerificationToken: {
      type: String,
      select: false,
      default: null,
    },

    emailVerificationExpiry: {
      type: Date,
      select: false,
      default: null,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "accounts",
  },
);

// ===| Index |────────────────────────────────────────────────────────────────────

//----|usign sparse so account withou email can exsit|
accountSchema.index({ email: 1 }, { unique: true, sparse: true });

accountSchema.index({ passwordResetToken: 1 }, { sparse: true });
accountSchema.index({ emailVerificationToken: 1 }, { sparse: true });

//-----|Quick check if account with exist for this provider with this providerId|
accountSchema.index({
  "authProviders.provider": 1,
  "authProviders.providerId": 1,
});

// ===| Hooks |────────────────────────────────────────────────────────────────────
accountSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ===| Methods |────────────────────────────────────────────────────────────────────
// Compare Password
accountSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

// check if account is locked
accountSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Checking if user has provider
accountSchema.methods.hasProvider = function (provider: AuthProvider): boolean {
  return this.authProviders.some(
    (p: IOAuthProvider) => p.provider === provider,
  );
};

// check if user has email or not
accountSchema.methods.needsEmail = function (): boolean {
  return !this.email;
};

accountSchema.methods.incrementLoginAttempts =
  async function (): Promise<void> {
    const maxAttempts = 5;
    const lockDuration = 30 * 60 * 1000;

    // increment failed login attempt if lock expired
    if (this.lockUntil && this.lockUntil < new Date()) {
      await this.updateOne({
        $set: { loginAttempts: 1 },
        $unset: { lockUntil: 1 },
      });
    }

    const attempts = this.loginAttempts + 1;
    const updates: Record<string, unknown> = { loginAttempts: attempts };

    // updating lock time if attempts exceed masAttempts
    if (attempts >= maxAttempts && !this.isLocked()) {
      updates.lockUntil = new Date(Date.now() + lockDuration);
    }

    await this.updateOne({ $set: updates });
  };

// called after successfull login
accountSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  await this.updateOne({
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 },
  });
};

// ===| Model |────────────────────────────────────────────────────────────────────
const Account = mongoose.model<IAccount>("Account", accountSchema);
export default Account;
