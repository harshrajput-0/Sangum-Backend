/**
 * ─────────────────────────────────────────────────────────────────────────
 * WHY TYPES LIVE IN THEIR OWN FILE
 * ─────────────────────────────────────────────────────────────────────────
 * Same rationale as auth.types.ts — tag.validation.ts (Zod) validates at
 * RUNTIME, this file describes the same shapes for the TypeScript
 * COMPILER, kept explicit for readability rather than z.infer<...>.
 * ─────────────────────────────────────────────────────────────────────────
 */

// ── Request payloads ─────────────────────────────────────────────────────

export interface CreateTagPayload {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateTagPayload {
  description?: string; // "" clears it
  color?: string;        // "" clears it
}

export interface ListTagsQuery {
  page: number;
  limit: number;
  isOfficial?: boolean;
  sort: "popular" | "newest" | "alphabetical";
}

export interface SearchTagsQuery {
  q: string;
  page: number;
  limit: number;
}

// ── Response shapes ──────────────────────────────────────────────────────

export interface TagCreatorSummary {
  _id: string;
  username: string;
  displayName: string;
}

export interface TagResponse {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  usageCount: number;
  createdBy: TagCreatorSummary;
  isOfficial: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationMetaResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedTags {
  tags: TagResponse[];
  pagination: PaginationMetaResponse;
}
