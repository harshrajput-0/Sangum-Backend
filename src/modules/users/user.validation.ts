import { z } from "zod";

export const updateProfileSchema = z.object({
    displayName: z.string().trim().min(2).max(50).optional(),
    bio: z.string().trim().max(300).optional(),
    location: z.string().trim().max(100).optional(),

    socialLinkes: z.object({
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