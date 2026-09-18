import * as resourceRepository from "./resource.repository.js";
import * as tagService from "../tags/tag.service.js";
import * as notificationService from "../notifications/notification.service.js";
import UserStats from "../users/userStats.model.js";
import Resource, { ResourceStatus } from "./resource.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateUniqueSlug } from "../../utils/slugify.js";
import {
  PaginationParams,
  buildPaginationMeta,
} from "../../utils/pagination.js";
import {
  NotificationType,
  NotificationTargetType,
} from "../notifications/notification.model.js";
import { SubmitResourcePayload, ResourceFilters } from "./resource.types.js";

// Fetch a page of approved resources matching the filters, plus pagination metadata (total pages, etc.)
export const getApprovedResources = async (
  filters: ResourceFilters,
  pagination: PaginationParams,
) => {
  const [resources, total] = await Promise.all([
    resourceRepository.findAll(filters, pagination),
    resourceRepository.countAll(filters),
  ]);

  return {
    resources,
    meta: buildPaginationMeta(total, pagination.page, pagination.limit),
  };
};

/**
 * submitResource
 *
 * Unlike posts, a resource starts life as PENDING — it's not visible
 * to anyone but the submitter and moderators until approveResource
 * flips it. This is the moderation gate the model's ResourceStatus
 * enum exists for: keeping low-quality/spam links out of the public
 * library by default, rather than after the fact.
 */
export const submitResource = async (
  data: SubmitResourcePayload,
  userId: string,
) => {
  // Resolve/create tags (if any were provided) into tag IDs before 
  // saving the resource
const tagIds = data.tags
  ? (await tagService.processTags(data.tags, userId)) ?? []
  : [];

  
  // Generate a URL-safe, unique slug from the title
  const slug = await generateUniqueSlug(data.title, Resource);

  const resource = await resourceRepository.create({
    title: data.title,
    slug,
    description: data.description,
    url: data.url,
    type: data.type,
    communityId: data.communityId,
    tags: tagIds,
    isPaywalled: data.isPaywalled ?? false,
    submittedBy: userId,
    status: ResourceStatus.PENDING,
  } as any);

  // Tag usage counts increment immediately, even though the resource
  // itself is pending — the tag exists and was used, regardless of
  // whether the submission is later approved or rejected.
  if (tagIds.length) {
  await tagService.incrementUsage(tagIds);
}

  return resource;
};

// Fetch a single resource by slug, or throw a 404-style ApiError if it doesn't exist
export const getResourceBySlug = async (slug: string) => {
  const resource = await resourceRepository.findBySlug(slug);
  if (!resource) throw ApiError.notFound("Resource not found");
  return resource;
};

// Update a resource's editable fields (title/description/tags), enforcing ownership and edit-window rules
export const updateResource = async (
  slug: string,
  data: { title?: string; description?: string; tags?: string[] },
  userId: string,
  userRole: string,
) => {
  const resource = await resourceRepository.findBySlug(slug);
  if (!resource) throw ApiError.notFound("Resource not found");

  const isSubmitter = resource.submittedBy.toString() === userId;
  const isAdmin = userRole === "admin";

  // Only the original submitter or an admin may edit
  if (!isSubmitter && !isAdmin) {
    throw ApiError.forbidden("You can only edit your own resources");
  }

  // A submitter can only edit while it's still pending — once
  // approved/rejected, editing the content would let someone quietly
  // change what was reviewed after the fact. An admin can edit anytime.
  if (isSubmitter && !isAdmin && resource.status !== ResourceStatus.PENDING) {
    throw ApiError.badRequest(
      "Can't edit a resource that's already been reviewed",
    );
  }

  const updateData: Record<string, unknown> = { ...data };
  // If tags were included in the update, re-resolve them into tag IDs (same as on submit)
  if (data.tags) {
    updateData.tags = await tagService.processTags(data.tags, userId);
  }

  return resourceRepository.update(resource._id.toString(), updateData);
};

// Soft-delete a resource, enforcing that only the submitter or an admin can do so
export const deleteResource = async (
  slug: string,
  userId: string,
  userRole: string,
) => {
  const resource = await resourceRepository.findBySlug(slug);
  if (!resource) throw ApiError.notFound("Resource not found");

  const isSubmitter = resource.submittedBy.toString() === userId;
  const isAdmin = userRole === "admin";

  if (!isSubmitter && !isAdmin) {
    throw ApiError.forbidden("You can only delete your own resources");
  }

  await resourceRepository.softDelete(resource._id.toString());
};

// Moderator/admin action: approve a pending resource, bump the submitter's resource count, and notify them
export const approveResource = async (slug: string, reviewerId: string) => {
  const resource = await resourceRepository.findBySlug(slug);
  if (!resource) throw ApiError.notFound("Resource not found");

  await resourceRepository.updateStatus(
    resource._id.toString(),
    ResourceStatus.APPROVED,
    reviewerId,
  );
  await UserStats.updateOne(
    { userId: resource.submittedBy },
    { $inc: { resourcesCount: 1 } },
  );

  await notificationService.createNotification({
    recipientId: resource.submittedBy.toString(),
    senderId: reviewerId,
    type: NotificationType.RESOURCE_APPROVED,
    targetId: resource._id.toString(),
    targetType: NotificationTargetType.RESOURCE,
    message: `Your resource "${resource.title}" was approved`,
  });
};

// Moderator/admin action: reject a pending resource with an optional note, and notify the submitter
export const rejectResource = async (
  slug: string,
  reviewerId: string,
  note?: string,
) => {
  const resource = await resourceRepository.findBySlug(slug);
  if (!resource) throw ApiError.notFound("Resource not found");

  await resourceRepository.updateStatus(
    resource._id.toString(),
    ResourceStatus.REJECTED,
    reviewerId,
    note,
  );

  await notificationService.createNotification({
    recipientId: resource.submittedBy.toString(),
    senderId: reviewerId,
    type: NotificationType.RESOURCE_REJECTED,
    targetId: resource._id.toString(),
    targetType: NotificationTargetType.RESOURCE,
    message: `Your resource "${resource.title}" was rejected${note ? `: ${note}` : ""}`,
  });
};

// Increment a resource's view count; silently no-ops if the slug doesn't resolve to a resource
export const recordView = async (slug: string) => {
  const resource = await resourceRepository.findBySlug(slug);
  if (!resource) return;
  await resourceRepository.incrementView(resource._id.toString());
};
