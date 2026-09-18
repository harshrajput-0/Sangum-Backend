import Resource, { IResource, ResourceStatus, ResourceType } from "./resource.model.js";
import { PaginationParams } from "../../utils/pagination.js";

// Paginated list of approved, non-deleted resources, optionally filtered by type/tag/community.
// Populates submitter info and tag details, sorted with featured resources first.
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

// Count of approved, non-deleted resources matching the same filters as findAll — used for pagination totals
export const countAll = (filters: { type?: ResourceType; tag?: string; communityId?: string }) => {
  const query: Record<string, unknown> = { status: ResourceStatus.APPROVED, isDeleted: false };
  if (filters.type) query.type = filters.type;
  if (filters.tag) query.tags = filters.tag;
  if (filters.communityId) query.communityId = filters.communityId;
  return Resource.countDocuments(query);
};

// Fetch a single non-deleted resource by slug, with submitter and tag details populated.
// Note: not filtered by status, so this can return pending/rejected resources too.
export const findBySlug = (slug: string) => {
  return Resource.findOne({ slug, isDeleted: false })
    .populate("submittedBy", "username displayName avatar")
    .populate("tags", "name slug color");
};

// Fetch a resource by its Mongo ID, no filtering
export const findById = (resourceId: string) => Resource.findById(resourceId);

// Paginated list of approved, non-deleted resources belonging to a specific community
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

// Count of a submitter's approved, non-deleted resources — pairs with findBySubmitter for pagination totals
export const countBySubmitter = (submittedBy: string) => {
  return Resource.countDocuments({ submittedBy, status: ResourceStatus.APPROVED, isDeleted: false });
};

// Create a new resource document
export const create = (data: Partial<IResource>) => Resource.create(data);

// Update a resource by ID and return the updated document
export const update = (resourceId: string, data: Partial<IResource>) => {
  return Resource.findByIdAndUpdate(resourceId, data, { new: true });
};

// Soft delete — flags the resource as deleted rather than removing it from the DB
export const softDelete = (resourceId: string) => {
  return Resource.findByIdAndUpdate(resourceId, { isDeleted: true });
};

// Moderator action: set a resource's status (approved/rejected/etc), recording who reviewed it, when, and an optional note
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

// Bump the view counter by 1
export const incrementView = (resourceId: string) => {
  return Resource.findByIdAndUpdate(resourceId, { $inc: { viewsCount: 1 } });
};

// Bump (or decrement, if `by` is negative) the bookmark counter
export const incrementBookmarkCount = (resourceId: string, by = 1) => {
  return Resource.findByIdAndUpdate(resourceId, { $inc: { bookmarksCount: by } });
};

// Check whether a given slug is already taken — used for slug uniqueness validation before create
export const slugExists = (slug: string) => Resource.exists({ slug });