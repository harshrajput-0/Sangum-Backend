import mongoose, { Document, Schema, Types } from "mongoose";

export interface IWaitlist {
    email: "string"
    createdAt: Date;
}



const waitlistSchema = new Schema<IWaitlist>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Waitlist = mongoose.model<IWaitlist>("Waitlist", waitlistSchema);