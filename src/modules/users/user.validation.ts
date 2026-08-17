import { z } from "zod";
import {
  USERNAME_REGEX,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_RULE_MESSAGE,
} from "../../utils/username.js";

// multipart/form-data sends absent fields as either missing keys OR empty
// strings depending on the client, so we normalise both to "not provided"
// before running the real checks — an empty string should trigger the same
// auto-generation fallback as leaving the field out entirely.
const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

export const onboardingSchema = z.object({
  // Same rule as registerSchema (auth.validaton.ts) and user.model.ts —
  // previously this had its own slightly-looser regex (allowed leading/
  // trailing/consecutive underscores) that could pass here and still
  // fail Mongoose's own `match` validator on save. See utils/username.ts.
  username: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .toLowerCase()
      .min(USERNAME_MIN_LENGTH, `Username require at least ${USERNAME_MIN_LENGTH} characters`)
      .max(USERNAME_MAX_LENGTH, `Username cannot exceed ${USERNAME_MAX_LENGTH} characters`)
      .regex(USERNAME_REGEX, USERNAME_RULE_MESSAGE)
      .optional(),
  ),
  fullName: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(2, "Display name must be at least 2 characters")
      .max(50, "Display name cannot exceed 50 characters")
      .optional(),
  ),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(50).optional(),
  bio: z.string().trim().max(300).optional(),
  location: z.string().trim().max(100).optional(),

  socialLinks: z
    .object({
      twitter: z.string().trim().max(200).optional(),
      github: z.string().trim().max(200).optional(),
      linkedin: z.string().trim().max(200).optional(),
      youtube: z.string().trim().max(200).optional(),
      website: z.string().trim().max(200).optional().or(z.literal("")),
    })
    .optional(),
});

// Used by GET /users/search?q=
// A search query shouldn't be very long
export const searchUsersSchema = z.object({
  q: z.string().trim().min(1).max(50),
});

export const usernameParamSchema = z.object({
  username: z.string().trim().toLowerCase(),
});
