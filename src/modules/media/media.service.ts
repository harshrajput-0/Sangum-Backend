import * as mediaRepository from "./media.repository.js";
import { ApiError } from "../../utils/ApiError.js";
import { buildPaginationMeta } from "../../utils/pagination.js";
import { UserRole } from "../users/user.model.js";
import {
  CreateMediaPayload,
  UpdateMediaPayload,
  ListMyMediaQuery,
  MediaResponse,
  PaginatedMedia,
} from "./media.types.js";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * MEDIA SERVICE
 * ═══════════════════════════════════════════════════════════════════════
 * Same layering rule as auth.service.ts: every business decision lives
 * here, controllers stay thin, the repository stays a pure DB-query layer.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY createMedia TAKES A URL, NOT A FILE
 * ─────────────────────────────────────────────────────────────────────────
 * `uploadToCloudinary.ts` and `upload.middleware.ts` (Multer) don't exist
 * yet. Rather than block this whole module on those, createMedia below
 * assumes the actual bytes already made it to Cloudinary through a
 * DIRECT, client-to-Cloudinary upload (a signed-upload or unsigned
 * preset flow, both standard Cloudinary patterns) — the browser uploads
 * the file straight to Cloudinary, gets back { url, public_id, ... }, and
 * THIS endpoint just records that result as a Media document. This is a
 * genuinely common, production-viable architecture, not merely a
 * placeholder — plenty of real apps never route upload bytes through
 * their own server at all. If a server-side Multer + upload.middleware.ts
 * pipeline is built later instead (or in addition), it would end by
 * calling this exact same service function with the Cloudinary result it
 * gets back — the contract here doesn't need to change either way.
 *
 * Same scoping decision already made for avatar/banner uploads in the
 * users module, applied here at the dedicated Media-module level instead.
 *
 * NOT HERE YET:
 *   - Actual Cloudinary asset deletion. deleteMedia() below only
 *     soft-deletes the DB record — the underlying Cloudinary asset stays
 *     in their account. A `deleteFromCloudinary(publicId)` call belongs
 *     here once uploadToCloudinary.ts exists to pair with it.
 *   - Cross-module "is this media still referenced" checks before delete
 *     (a Post's `media` array, a User's avatar, etc.) — unlike Tag's
 *     usageCount (a single self-contained counter), this would mean
 *     querying every module that CAN reference media, which is a lot of
 *     coupling for what's a fairly rare edge case (deleting media that's
 *     actively in use). Deleting in-use media currently just leaves a
 *     dangling reference, same tradeoff already accepted implicitly
 *     elsewhere until each referencing module's populate/mapping code is
 *     hardened against it.
 * ═══════════════════════════════════════════════════════════════════════
 */

const toMediaResponse = (media: any): MediaResponse => ({
  _id: media._id.toString(),
  uploadedBy: media.uploadedBy.toString(),
  url: media.url,
  // publicId deliberately omitted — it's Cloudinary's internal asset
  // identifier (needed server-side for eventual deletion), not something
  // the frontend renders or otherwise needs.
  type: media.type,
  mimeType: media.mimeType,
  size: media.size,
  width: media.width ?? null,
  height: media.height ?? null,
  duration: media.duration ?? null,
  altText: media.altText ?? null,
  context: media.context,
  createdAt: media.createdAt,
});

// ─────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────

export const createMedia = async (
  userId: string,
  payload: CreateMediaPayload
): Promise<MediaResponse> => {
  const data: Record<string, unknown> = {
    uploadedBy: userId,
    url: payload.url,
    publicId: payload.publicId,
    type: payload.type,
    mimeType: payload.mimeType,
    size: payload.size,
    context: payload.context,
  };
  if (payload.width) data.width = payload.width;
  if (payload.height) data.height = payload.height;
  if (payload.duration) data.duration = payload.duration;
  if (payload.altText) data.altText = payload.altText;

  const created = await mediaRepository.createMedia(data as any);
  return toMediaResponse(created);
};

// ─────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────

export const getMediaById = async (mediaId: string): Promise<MediaResponse> => {
  const media = await mediaRepository.findByIdRaw(mediaId);
  if (!media || media.isDeleted) {
    throw ApiError.notFound("Media not found");
  }
  return toMediaResponse(media);
};

export const listMyMedia = async (
  userId: string,
  query: ListMyMediaQuery
): Promise<PaginatedMedia> => {
const filters = {
  uploadedBy: userId,
  ...(query.context !== undefined && { context: query.context }),
  ...(query.type !== undefined && { type: query.type }),
};

const { media, total } = await mediaRepository.listByUploader(
  filters,
  query.page,
  query.limit
);

  return {
    media: media.map(toMediaResponse),
    pagination: buildPaginationMeta(total, query.page, query.limit),
  };
};

// ─────────────────────────────────────────────────────────────────────────
// UPDATE / DELETE
// ─────────────────────────────────────────────────────────────────────────

/** Only altText is editable — url/publicId/type/mimeType/size/dimensions
 *  are facts about the uploaded file itself, fixed at creation. */
export const updateMedia = async (
  mediaId: string,
  userId: string,
  payload: UpdateMediaPayload
): Promise<MediaResponse> => {
  const existing = await mediaRepository.findByIdRaw(mediaId);
  if (!existing || existing.isDeleted) {
    throw ApiError.notFound("Media not found");
  }
  if (existing.uploadedBy.toString() !== userId) {
    throw ApiError.forbidden("You can only edit your own media");
  }

  const set: Record<string, unknown> = {};
  const unset: string[] = [];

  if (payload.altText !== undefined) {
    if (payload.altText === "") unset.push("altText");
    else set.altText = payload.altText;
  }

  const updated = await mediaRepository.updateById(mediaId, { set, unset });
  if (!updated) throw ApiError.notFound("Media not found");

  return toMediaResponse(updated);
};

export const deleteMedia = async (
  mediaId: string,
  userId: string,
  userRole: UserRole
): Promise<void> => {
  const existing = await mediaRepository.findByIdRaw(mediaId);
  if (!existing || existing.isDeleted) {
    throw ApiError.notFound("Media not found");
  }

  const isOwner = existing.uploadedBy.toString() === userId;
  const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;

  if (!isOwner && !isElevated) {
    throw ApiError.forbidden("You don't have permission to delete this media");
  }

  await mediaRepository.softDelete(mediaId);
};
