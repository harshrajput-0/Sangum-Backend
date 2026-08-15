import { z } from "zod";

// multipart/form-data sends absent fields as either missing keys OR empty
// strings depending on the client, so we normalise both to "not provided"
// before running the real checks — an empty string should trigger the same
// auto-generation fallback as leaving the field out entirely.
const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

export const onboardingSchema = z.object({
  username: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .toLowerCase()
      .min(5, "Username require at least 5 characters")
      .max(20, "Username cannot exceed 20 characters")
      .regex(
        /^(?![.-])(?!.*[.-]{2,})[a-z0-9_.-]+(?<![.-])$/,
        "Username can contain lowercase letters, numbers, underscores, hyphens, and dots, but can't start or end with a hyphen/dot, or contain them consecutively",
      )
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

  socialLinkes: z
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
