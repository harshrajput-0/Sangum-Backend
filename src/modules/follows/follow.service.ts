import * as followRepository from "./follow.repository.js";
import { ApiError } from "../../utils/ApiError.js";
import { buildPaginationMeta } from "../../utils/pagination.js";
import { FollowEntry, FollowCounts, PaginatedFollows } from "./follow.types.js";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * FOLLOWS SERVICE
 * ═══════════════════════════════════════════════════════════════════════
 * Same layering rule as auth.service.ts.
 *
 * Counter updates (UserStats.followersCount/followingCount) are two
 * sequential writes, not wrapped in a transaction — same reasoning as
 * reactions/bookmarks counter updates: these are display counters where
 * a rare, brief inconsistency from a crash mid-operation is low-stakes
 * and self-correcting on the next full recount, unlike auth's User+Account
 * or Community's membership+count, where inconsistency would mean a
 * genuinely broken document relationship.
 * ═══════════════════════════════════════════════════════════════════════
 */

const toFollowEntry = (
  follow: any,
  userField: "followerId" | "followingId",
): FollowEntry => {
  const user = follow[userField];
  return {
    user: {
      _id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar ?? null,
      bio: user.bio ?? null,
    },
    followedAt: follow.createdAt,
  };
};

export const followUser = async (
  followerId: string,
  followingId: string,
): Promise<void> => {
  if (followerId === followingId) {
    throw ApiError.badRequest("You can't follow yourself");
  }

  const targetExists = await followRepository.userExists(followingId);
  if (!targetExists) {
    throw ApiError.notFound("User not found");
  }

  const existing = await followRepository.findFollow(followerId, followingId);
  if (existing) {
    throw ApiError.conflict("You're already following this user");
  }

  await followRepository.createFollow({ followerId, followingId } as any);
  await followRepository.incrementFollowingCount(followerId, 1);
  await followRepository.incrementFollowersCount(followingId, 1);
};

export const unfollowUser = async (
  followerId: string,
  followingId: string,
): Promise<void> => {
  const existing = await followRepository.findFollow(followerId, followingId);
  if (!existing) {
    throw ApiError.badRequest("You're not following this user");
  }

  await followRepository.deleteFollow(followerId, followingId);
  await followRepository.incrementFollowingCount(followerId, -1);
  await followRepository.incrementFollowersCount(followingId, -1);
};

export const checkIsFollowing = async (
  followerId: string,
  followingId: string,
): Promise<boolean> => {
  const existing = await followRepository.findFollow(followerId, followingId);
  return !!existing;
};

export const getFollowCounts = async (
  userId: string,
): Promise<FollowCounts> => {
  const stats = await followRepository.getStats(userId);
  return {
    followersCount: stats?.followersCount ?? 0,
    followingCount: stats?.followingCount ?? 0,
  };
};

export const listFollowers = async (
  userId: string,
  page: number,
  limit: number,
): Promise<PaginatedFollows> => {
  const { follows, total } = await followRepository.listFollowers(
    userId,
    page,
    limit,
  );

  return {
    users: follows.map((f) => toFollowEntry(f, "followerId")),
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const listFollowing = async (
  userId: string,
  page: number,
  limit: number,
): Promise<PaginatedFollows> => {
  const { follows, total } = await followRepository.listFollowing(
    userId,
    page,
    limit,
  );

  return {
    users: follows.map((f) => toFollowEntry(f, "followingId")),
    pagination: buildPaginationMeta(total, page, limit),
  };
};
