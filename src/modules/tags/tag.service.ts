import * as tagRepository from "./tag.repository.js";
import { ApiError } from "../../utils/ApiError.js";
import { buildPaginationMeta } from "../../utils/pagination.js";
import { slugify } from "../../utils/slugify.js";
import { UserRole } from "../users/user.model.js";
import {
  CreateTagPayload,
  UpdateTagPayload,
  ListTagsQuery,
  SearchTagsQuery,
  TagResponse,
  PaginatedTags,
} from "./tag.types.js";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * TAGS SERVICE
 * ═══════════════════════════════════════════════════════════════════════
 * Same layering rule as auth.service.ts: every business decision lives
 * here, controllers stay thin, the repository stays a pure DB-query layer.
 *
 * AUTHORIZATION MODEL:
 *   - Any authenticated user can CREATE a tag (cheap, user-generated,
 *     same pattern as GitHub topics / Stack Overflow tags).
 *   - Only ADMIN/MODERATOR can EDIT a tag's description/color, mark it
 *     official, or delete it. Tags are a shared, cross-cutting taxonomy
 *     that posts/communities/resources all reference — letting an
 *     arbitrary creator unilaterally redefine a tag's meaning after
 *     hundreds of other people's content has adopted it would be a real
 *     footgun, unlike a Post, which has one clear personal owner.
 *   - Name/slug are immutable once created — same "stable URLs" reasoning
 *     as Community, plus name changes on a widely-used tag would be
 *     confusing for exactly the people the taxonomy is meant to help.
 *
 * SCOPE OF THIS MODULE (v1) — deliberately not here yet, and why:
 *   - incrementUsage/decrementUsage are exposed by the repository but NOT
 *     yet called from Post or Community's create/update/delete flows —
 *     those modules were built and delivered before this one existed.
 *     Wiring `tagRepository.incrementUsage(tagId, 1)` into
 *     post.service.ts's createPost (and the community equivalent) is a
 *     small, well-scoped follow-up now that this module exists, not
 *     something silently assumed to already work.
 * ═══════════════════════════════════════════════════════════════════════
 */

const toTagResponse = (tag: any): TagResponse => ({
  _id: tag._id.toString(),
  name: tag.name,
  slug: tag.slug,
  description: tag.description ?? null,
  color: tag.color ?? null,
  usageCount: tag.usageCount,
  createdBy: {
    _id: tag.createdBy._id.toString(),
    username: tag.createdBy.username,
    displayName: tag.createdBy.displayName,
  },
  isOfficial: tag.isOfficial,
  createdAt: tag.createdAt,
  updatedAt: tag.updatedAt,
});

const requireModerator = (userRole: UserRole) => {
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MODERATOR) {
    throw ApiError.forbidden("Only moderators can do this");
  }
};

/** Tag slugs behave like Community's — memorable/guessable, plain slug
 *  tried first, numeric suffix only on actual collision. */
const generateUniqueSlug = async (name: string): Promise<string> => {
  const base = slugify(name);
  let candidate = base;
  let attempt = 1;

  while (await tagRepository.checkSlugTaken(candidate)) {
    attempt += 1;
    if (attempt > 20) {
      throw ApiError.conflict("Couldn't generate an available URL for this tag name");
    }
    candidate = `${base}-${attempt}`;
  }

  return candidate;
};

// ─────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────

export const createTag = async (
  userId: string,
  payload: CreateTagPayload
): Promise<TagResponse> => {
  const nameTaken = await tagRepository.checkNameTaken(payload.name);
  if (nameTaken) {
    throw ApiError.conflict("A tag with this name already exists");
  }

  const slug = await generateUniqueSlug(payload.name);

  const data: Record<string, unknown> = {
    name: payload.name,
    slug,
    createdBy: userId,
    // isOfficial is deliberately never set from the payload — always
    // false on creation. Regular users can't self-mark a tag official;
    // that's markOfficial() below, admin-only.
    isOfficial: false,
  };
  if (payload.description) data.description = payload.description;
  if (payload.color) data.color = payload.color;

  const created = await tagRepository.createTag(data as any);
  const populated = await tagRepository.findByIdPopulated(created._id.toString());
  return toTagResponse(populated);
};

// ─────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────

export const getTagBySlug = async (slug: string): Promise<TagResponse> => {
  const tag = await tagRepository.findBySlugPopulated(slug);
  if (!tag) throw ApiError.notFound("Tag not found");
  return toTagResponse(tag);
};


// ==| AFTER SEARCH IS AVAILABLE |-------------------------------------------
// export const listTags = async (query: ListTagsQuery): Promise<PaginatedTags> => {
//   const { tags, total } = await tagRepository.listTags(
//     { isOfficial: query.isOfficial },
//     query.page,
//     query.limit,
//     query.sort
//   );

//   return {
//     tags: tags.map(toTagResponse),
//     pagination: buildPaginationMeta({ page: query.page, limit: query.limit }, total),
//   };
// };



// export const searchTags = async (query: SearchTagsQuery): Promise<PaginatedTags> => {
//   const { tags, total } = await tagRepository.searchTags(query.q, query.page, query.limit);

//   return {
//     tags: tags.map(toTagResponse),
//     pagination: buildPaginationMeta({ page: query.page, limit: query.limit }, total),
//   };
// };

// ─────────────────────────────────────────────────────────────────────────
// UPDATE / DELETE — moderator-only, see module header
// ─────────────────────────────────────────────────────────────────────────

export const updateTag = async (
  tagId: string,
  userRole: UserRole,
  payload: UpdateTagPayload
): Promise<TagResponse> => {
  requireModerator(userRole);

  const existing = await tagRepository.findByIdRaw(tagId);
  if (!existing) throw ApiError.notFound("Tag not found");

  const set: Record<string, unknown> = {};
  const unset: string[] = [];

  if (payload.description !== undefined) {
    if (payload.description === "") unset.push("description");
    else set.description = payload.description;
  }
  if (payload.color !== undefined) {
    if (payload.color === "") unset.push("color");
    else set.color = payload.color;
  }

  const updated = await tagRepository.updateById(tagId, { set, unset });
  if (!updated) throw ApiError.notFound("Tag not found");

  return toTagResponse(updated);
};

/**
 * Blocked if usageCount > 0 — deleting a tag that's still referenced by
 * posts/communities/resources would leave those documents holding a
 * dangling ObjectId. Since incrementUsage/decrementUsage aren't wired up
 * from those modules yet (see header note), usageCount is currently
 * always 0 in practice — but this guard is written for when it isn't,
 * not left as a TODO to remember later.
 */
export const deleteTag = async (tagId: string, userRole: UserRole): Promise<void> => {
  requireModerator(userRole);

  const existing = await tagRepository.findByIdRaw(tagId);
  if (!existing) throw ApiError.notFound("Tag not found");

  if (existing.usageCount > 0) {
    throw ApiError.conflict(
      "This tag is still in use and can't be deleted — remove it from all content first"
    );
  }

  await tagRepository.deleteById(tagId);
};

export const markOfficial = async (tagId: string, userRole: UserRole): Promise<TagResponse> => {
  requireModerator(userRole);

  const updated = await tagRepository.setOfficial(tagId, true);
  if (!updated) throw ApiError.notFound("Tag not found");

  return toTagResponse(updated);
};

export const unmarkOfficial = async (tagId: string, userRole: UserRole): Promise<TagResponse> => {
  requireModerator(userRole);

  const updated = await tagRepository.setOfficial(tagId, false);
  if (!updated) throw ApiError.notFound("Tag not found");

  return toTagResponse(updated);
};
export function listTags(query: { page: number; limit: number; isOfficial?: boolean; sort: "popular" | "newest" | "alphabetical"; }) {
    throw new Error("Function not implemented.");
}

