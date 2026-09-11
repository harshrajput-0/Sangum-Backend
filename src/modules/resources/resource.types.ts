import { ResourceType, ResourceStatus } from "./resource.model.js";

// ── Request payloads ─────────────────────────────────────────────────────

export interface SubmitResourcePayload {
  title: string;
  description: string;
  url: string;
  type: ResourceType;
  thumbnail?: string;
  communityId?: string;
  tags?: string[];
  isPaywalled?: boolean;
}

export interface UpdateResourcePayload {
  title?: string;
  description?: string;
  url?: string;
  thumbnail?: string; // "" clears it
  tags?: string[];
  isPaywalled?: boolean;
}

export interface RejectResourcePayload {
  reviewNote?: string;
}

export interface ToggleFeaturedPayload {
  isFeatured: boolean;
}

export interface ListResourcesQuery {
  page: number;
  limit: number;
  type?: ResourceType;
  communityId?: string;
  tag?: string;
  isFeatured?: boolean;
  sort: "newest" | "popular";
}

export interface SearchResourcesQuery {
  q: string;
  page: number;
  limit: number;
}

export interface ListPendingQuery {
  page: number;
  limit: number;
}

// ── Response shapes ──────────────────────────────────────────────────────

export interface ResourceSubmitterSummary {
  _id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

export interface ResourceCommunitySummary {
  _id: string;
  name: string;
  slug: string;
}

export interface ResourceTagSummary {
  _id: string;
  name: string;
  slug: string;
  color: string | null;
}

export interface ResourceResponse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  url: string;
  type: ResourceType;
  status: ResourceStatus;
  thumbnail: string | null;
  submittedBy: ResourceSubmitterSummary;
  community: ResourceCommunitySummary | null;
  tags: ResourceTagSummary[];
  isPaywalled: boolean;
  isFeatured: boolean;
  viewsCount: number;
  bookmarksCount: number;
  reviewNote: string | null;
  reviewedAt: Date | null;
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

export interface PaginatedResources {
  resources: ResourceResponse[];
  pagination: PaginationMetaResponse;
}
