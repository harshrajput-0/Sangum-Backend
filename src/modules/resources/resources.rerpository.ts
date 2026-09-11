import Resource, { IResource, ResourceStatus, ResourceType } from "./resource.model.js";
import { PaginationParams } from "../../utils/pagination.js";

export const findAll = (
  filters: { type?: ResourceType; tag?: string; communityId?: string },
  { skip, limit }: PaginationParams
) => {
  const query: Record<string, unknown> = { status: ResourceStatus.APPROVED, isDeleted: false };
  if (filters.type) query.type = filters.type;
  if (filters.tag) query.tags = filters.tag;
  if (filters.communityId) query.communityId = filters.communityId;

  return Resource.find(query)
    .populate("submittedBy", "username displayName avatar")
    .populate("tags", "name slug color")
    .sort({ isFeatured: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export const countAll = (filters: { type?: ResourceType; tag?: string; communityId?: string }) => {
  const query: Record<string, unknown> = { status: ResourceStatus.APPROVED, isDeleted: false };
  if (filters.type) query.type = filters.type;
  if (filters.tag) query.tags = filters.tag;
  if (filters.communityId) query.communityId = filters.communityId;
  return Resource.countDocuments(query);
};

export const findBySlug = (slug: string) => {
  return Resource.findOne({ slug, isDeleted: false })
    .populate("submittedBy", "username displayName avatar")
    .populate("tags", "name slug color");
};

export const findById = (resourceId: string) => Resource.findById(resourceId);

export const findByCommunity = (communityId: string, { skip, limit }: PaginationParams) => {
  return Resource.find({ communityId, status: ResourceStatus.APPROVED, isDeleted: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Used by user.service.ts's getUserResources — the "Resources" tab on
 * a profile page. Deliberately only shows APPROVED ones — a visitor
 * looking at someone else's profile shouldn't see their pending/
 * rejected submissions; the submitter can see those via their own
 * dashboard view once that's built, not through this public endpoint.
 */
export const findBySubmitter = (submittedBy: string, { skip, limit }: PaginationParams) => {
  return Resource.find({ submittedBy, status: ResourceStatus.APPROVED, isDeleted: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export const countBySubmitter = (submittedBy: string) => {
  return Resource.countDocuments({ submittedBy, status: ResourceStatus.APPROVED, isDeleted: false });
};

export const create = (data: Partial<IResource>) => Resource.create(data);

export const update = (resourceId: string, data: Partial<IResource>) => {
  return Resource.findByIdAndUpdate(resourceId, data, { new: true });
};

export const softDelete = (resourceId: string) => {
  return Resource.findByIdAndUpdate(resourceId, { isDeleted: true });
};

export const updateStatus = (
  resourceId: string,
  status: ResourceStatus,
  reviewerId: string,
  note?: string
) => {
  return Resource.findByIdAndUpdate(resourceId, {
    status,
    reviewedBy: reviewerId,
    reviewNote: note,
    reviewedAt: new Date(),
  });
};

export const incrementView = (resourceId: string) => {
  return Resource.findByIdAndUpdate(resourceId, { $inc: { viewsCount: 1 } });
};

export const incrementBookmarkCount = (resourceId: string, by = 1) => {
  return Resource.findByIdAndUpdate(resourceId, { $inc: { bookmarksCount: by } });
};

export const slugExists = (slug: string) => Resource.exists({ slug });
