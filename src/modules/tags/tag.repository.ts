import type { QueryFilter } from "mongoose";
import Tag, { ITag } from "./tag.model.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * THE ONE RULE FOR THIS FILE
 * ─────────────────────────────────────────────────────────────────────────
 * No business logic — just DB queries. tag.service.ts is the only file
 * that imports from here.
 * ─────────────────────────────────────────────────────────────────────────
 */

const POPULATE_CREATOR = { path: "createdBy", select: "username displayName" };

export const createTag = (data: Partial<ITag>) => {
  return Tag.create(data);
};

/** Unpopulated — internal use (existence/ownership checks). */
export const findByIdRaw = (tagId: string) => {
  return Tag.findById(tagId);
};

export const findByIdPopulated = (tagId: string) => {
  return Tag.findById(tagId).populate(POPULATE_CREATOR);
};

export const findBySlugPopulated = (slug: string) => {
  return Tag.findOne({ slug }).populate(POPULATE_CREATOR);
};

export const checkNameTaken = async (name: string): Promise<boolean> => {
  // name is stored lowercase (schema-level `lowercase: true`) — the
  // caller is expected to have already lowercased `name` too (Zod's
  // createTagSchema does `.toLowerCase()`), so this is a direct match,
  // not a case-insensitive query.
  return !!(await Tag.exists({ name }));
};

export const checkSlugTaken = async (slug: string): Promise<boolean> => {
  return !!(await Tag.exists({ slug }));
};

export interface UpdateOptions {
  set?: Record<string, unknown>;
  unset?: string[];
}

export const updateById = (tagId: string, options: UpdateOptions) => {
  const update: Record<string, unknown> = {};
  if (options.set && Object.keys(options.set).length > 0) update.$set = options.set;
  if (options.unset && options.unset.length > 0) {
    update.$unset = Object.fromEntries(options.unset.map((key) => [key, 1]));
  }

  return Tag.findByIdAndUpdate(tagId, update as any, {
    new: true,
    runValidators: true,
  }).populate(POPULATE_CREATOR);
};

export const deleteById = (tagId: string) => {
  return Tag.findByIdAndDelete(tagId);
};

export const setOfficial = (tagId: string, isOfficial: boolean) => {
  return Tag.findByIdAndUpdate(tagId, { $set: { isOfficial } }, { new: true }).populate(
    POPULATE_CREATOR
  );
};

export const incrementUsage = (tagId: string, delta: number) => {
  return Tag.findByIdAndUpdate(tagId, { $inc: { usageCount: delta } });
};

export interface TagFilters {
  isOfficial?: boolean;
}

export const listTags = async (
  filters: TagFilters,
  page: number,
  limit: number,
  sort: "popular" | "newest" | "alphabetical"
): Promise<{ tags: ITag[]; total: number }> => {
  const filter: QueryFilter<ITag> = {};
  if (filters.isOfficial !== undefined) filter.isOfficial = filters.isOfficial;

  const sortStage: Record<string, 1 | -1> =
    sort === "alphabetical"
      ? { name: 1 }
      : sort === "newest"
        ? { createdAt: -1 }
        : { usageCount: -1 };

  const [tags, total] = await Promise.all([
    Tag.find(filter)
      .sort(sortStage)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE_CREATOR),
    Tag.countDocuments(filter),
  ]);

  return { tags, total };
};

/**
 * $text search against the text index on tag.model.ts (`name`).
 * Same $text-not-$regex reasoning as every other module's search —
 * SECURITY_AUDIT.md's Critical finding is a ReDoS via unsanitized
 * $regex specifically in a TAG search endpoint, which makes this the
 * one module where reaching for $regex out of habit would be the exact
 * mistake already flagged as critical elsewhere in this codebase.
 */
export const searchTags = async (
  query: string,
  page: number,
  limit: number
): Promise<{ tags: ITag[]; total: number }> => {
  const filter = { $text: { $search: query } };
  const projection = { score: { $meta: "textScore" } };

  const [tags, total] = await Promise.all([
    Tag.find(filter, projection)
      .sort({ score: { $meta: "textScore" } })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE_CREATOR),
    Tag.countDocuments(filter),
  ]);

  return { tags, total };
};
