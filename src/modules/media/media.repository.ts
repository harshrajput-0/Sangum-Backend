import { QueryFilter } from "mongoose";
import Media, { IMedia, MediaType, MediaContext } from "./media.model.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * THE ONE RULE FOR THIS FILE
 * ─────────────────────────────────────────────────────────────────────────
 * No business logic — just DB queries. media.service.ts is the only file
 * that imports from here.
 * ─────────────────────────────────────────────────────────────────────────
 */

export const createMedia = (data: Partial<IMedia>) => {
  return Media.create(data);
};

export const findByIdRaw = (mediaId: string) => {
  return Media.findById(mediaId);
};

export interface UpdateOptions {
  set?: Record<string, unknown>;
  unset?: string[];
}

export const updateById = (mediaId: string, options: UpdateOptions) => {
  const update: Record<string, unknown> = {};
  if (options.set && Object.keys(options.set).length > 0) update.$set = options.set;
  if (options.unset && options.unset.length > 0) {
    update.$unset = Object.fromEntries(options.unset.map((key) => [key, 1]));
  }

  return Media.findByIdAndUpdate(mediaId, update as any, {
    new: true,
    runValidators: true,
  });
};

export const softDelete = (mediaId: string) => {
  return Media.findByIdAndUpdate(mediaId, { $set: { isDeleted: true } });
};

export interface MediaFilters {
  uploadedBy: string;
  context?: MediaContext;
  type?: MediaType;
}

export const listByUploader = async (
  filters: MediaFilters,
  page: number,
  limit: number
): Promise<{ media: IMedia[]; total: number }> => {
  const filter: QueryFilter<IMedia> = { uploadedBy: filters.uploadedBy, isDeleted: false };
  if (filters.context) filter.context = filters.context;
  if (filters.type) filter.type = filters.type;

  const [media, total] = await Promise.all([
    Media.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Media.countDocuments(filter),
  ]);

  return { media, total };
};
