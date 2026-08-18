export interface ListFollowersQuery {
  page: number;
  limit: number;
}

export interface ListFollowingQuery {
  page: number;
  limit: number;
}

export interface FollowUserSummary {
  _id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
}

export interface FollowEntry {
  user: FollowUserSummary;
  followedAt: Date;
}

export interface FollowCounts {
  followersCount: number;
  followingCount: number;
}

export interface PaginationMetaResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedFollows {
  users: FollowEntry[];
  pagination: PaginationMetaResponse;
}
