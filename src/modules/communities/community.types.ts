import { CommunityType, CommunityCategory, ICommunityRule } from "./community.model.js";
import { CommunityMemberRole, MembershipStatus } from "./communityMember.model.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * WHY TYPES LIVE IN THEIR OWN FILE
 * ─────────────────────────────────────────────────────────────────────────
 * Same rationale as auth.types.ts — community.validation.ts (Zod) validates
 * at RUNTIME, this file describes the same shapes for the TypeScript
 * COMPILER, kept explicit for readability rather than z.infer<...>.
 * ─────────────────────────────────────────────────────────────────────────
 */

// ── Request payloads — Community ─────────────────────────────────────────

export interface CreateCommunityPayload {
  name: string;
  description: string;
  shortDescription?: string;
  avatar?: string;
  banner?: string;
  type?: CommunityType;
  category: CommunityCategory;
  tags?: string[];
  rules?: { title: string; description: string }[];
}

export interface UpdateCommunityPayload {
  description?: string;
  shortDescription?: string;     // "" clears it
  avatar?: string;                // "" clears it
  banner?: string;                // "" clears it
  type?: CommunityType;
  category?: CommunityCategory;
  tags?: string[];
  rules?: { title: string; description: string }[];
  // name/slug are deliberately NOT editable after creation — see
  // community.service.ts's header comment for why.
}

export interface ListCommunitiesQuery {
  page: number;
  limit: number;
  category?: CommunityCategory;
  type?: CommunityType;
  sort: "newest" | "popular";
}

export interface SearchCommunitiesQuery {
  q: string;
  page: number;
  limit: number;
}

// ── Request payloads — Membership ────────────────────────────────────────

export interface BanMemberPayload {
  reason?: string;
}

export interface MuteMemberPayload {
  reason?: string;
  durationHours: number;
}

export interface UpdateMemberRolePayload {
  role: CommunityMemberRole.MODERATOR | CommunityMemberRole.MEMBER;
}

export interface ListMembersQuery {
  page: number;
  limit: number;
  role?: CommunityMemberRole;
  status?: MembershipStatus;
}

// ── Response shapes ──────────────────────────────────────────────────────

export interface CommunityCreatorSummary {
  _id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

export interface CommunityTagSummary {
  _id: string;
  name: string;
  slug: string;
  color: string | null;
}

/** Present only when the request is authenticated — tells the frontend
 *  whether/how the viewer relates to this community without a second
 *  round-trip (join button vs. "already a member" vs. "pending approval"). */
export interface ViewerMembership {
  role: CommunityMemberRole;
  status: MembershipStatus;
}

export interface CommunityResponse {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  avatar: string | null;
  banner: string | null;
  createdBy: CommunityCreatorSummary;
  type: CommunityType;
  category: CommunityCategory;
  tags: CommunityTagSummary[];
  rules: ICommunityRule[];
  membersCount: number;
  postsCount: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  viewerMembership: ViewerMembership | null;
}

/** Lighter shape for list/search results — no rules, no viewer membership
 *  (would be an N+1 query across a whole page of results). Mirrors the
 *  UserSummary vs. PublicUserProfile split already established in the
 *  users module, for the same reason. */
export interface CommunitySummary {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  avatar: string | null;
  banner: string | null;
  type: CommunityType;
  category: CommunityCategory;
  membersCount: number;
  postsCount: number;
  isVerified: boolean;
  createdAt: Date;
}

export interface MemberUserSummary {
  _id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

export interface MemberResponse {
  _id: string;
  user: MemberUserSummary;
  role: CommunityMemberRole;
  status: MembershipStatus;
  joinedAt: Date;
  mutedUntil: Date | null;
  muteReason: string | null;
  banReason: string | null;
}

export interface PaginationMetaResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedCommunities {
  communities: CommunitySummary[];
  pagination: PaginationMetaResponse;
}

export interface PaginatedMembers {
  members: MemberResponse[];
  pagination: PaginationMetaResponse;
}
