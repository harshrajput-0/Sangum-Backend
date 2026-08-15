import { UserRole, IBadge, ISocialLinks } from "./user.model.js";

// ===| REQUEST PAYLOADS |────────────────────────────────────────────────────────────────

export interface OnboardingPayload {
    username?: string;
    fullName?: string;
}

export interface OnboardingResponse {
    username: string;
    displayName: string;
    avatar: string | null;
    isProfileComplete: boolean;
}

export interface UpdateProfilePayloads {
    displayName?: string;
    bio?: string;
    location?: string;
    socialLinks?: {
        twitter?: string;
        github?: string;
        linkedin?: string;
        website?: string;
        youtube?: string;
    };
};


// ===| RESPONSE SHAPE |────────────────────────────────────────────────────────────────

export interface UserProfileResponse {
    _id: string;
    username: string;
    displayName: string;
    avatar: string | null;
    banner: string | null;
    bio: string | null;
    location: string | null;
    socialLinks: ISocialLinks;
    role: UserRole;
    badges: { type: string, awardedAi: Date }[];
    isOnline: boolean;
    lastSeen: Date;
    createdAt: Date;
    // only present when authenticated
    // tells wheather show "follow", "following", etc buttons
    isFollowing?: boolean;
    // when visiting your own profile
    isOwnProfile?: boolean;
}