import Follow, { IFollow } from "./follow.model.js";
import User from "../users/user.model.js";
import UserStats from "../users/userStats.model.js"; 

/**
 * ─────────────────────────────────────────────────────────────────────────
 * THE ONE RULE FOR THIS FILE
 * ─────────────────────────────────────────────────────────────────────────
 * No business logic — just DB queries. follow.service.ts is the only file
 * that imports from here. Touches User directly for existence checks and
 * populate (same as post.repository.ts populating authorId) — no Users
 * service/repository needs to exist for that, since it's a normal
 * Mongoose model relationship, not a cross-service call.
 * ─────────────────────────────────────────────────────────────────────────
 */

const POPULATE_USER = { path: "followerId", select: "username displayName avatar bio" };
const POPULATE_TARGET = { path: "followingId", select: "username displayName avatar bio" };

export const userExists = async (userId: string): Promise<boolean> => {
  return !!(await User.exists({ _id: userId }));
};

export const findFollow = (followerId: string, followingId: string) => {
  return Follow.findOne({ followerId, followingId });
};

export const createFollow = (data: Partial<IFollow>) => {
  return Follow.create(data);
};

export const deleteFollow = (followerId: string, followingId: string) => {
  return Follow.findOneAndDelete({ followerId, followingId });
};

export const listFollowers = async (
  userId: string,
  page: number,
  limit: number
): Promise<{ follows: IFollow[]; total: number }> => {
  const filter = { followingId: userId };

  const [follows, total] = await Promise.all([
    Follow.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE_USER),
    Follow.countDocuments(filter),
  ]);

  return { follows, total };
};

export const listFollowing = async (
  userId: string,
  page: number,
  limit: number
): Promise<{ follows: IFollow[]; total: number }> => {
  const filter = { followerId: userId };

  const [follows, total] = await Promise.all([
    Follow.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE_TARGET),
    Follow.countDocuments(filter),
  ]);

  return { follows, total };
};

export const getStats = (userId: string) => {
  return UserStats.findOne({ userId }).select("followersCount followingCount");
};

export const incrementFollowersCount = (userId: string, delta: number) => {
  return UserStats.findOneAndUpdate({ userId }, { $inc: { followersCount: delta } });
};

export const incrementFollowingCount = (userId: string, delta: number) => {
  return UserStats.findOneAndUpdate({ userId }, { $inc: { followingCount: delta } });
};
