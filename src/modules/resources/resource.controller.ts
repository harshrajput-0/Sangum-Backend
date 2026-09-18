import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getPaginationParams } from "../../utils/pagination.js";
import * as resourceService from "./resource.service.js";
import { ApiError } from "../../utils/ApiError.js";

const getParamSlug = (req: Request) => {
  const { slug } = req.params;

  if (typeof slug !== "string") {
    throw ApiError.badRequest("Invalid slug");
  }

  return slug;
};


// GET /resources - list approved resources, supports filtering by type/tag/community and pagination
export const getResources = asyncHandler(async (req: Request, res: Response) => {
  // Parse page/limit (or similar) pagination params from the query string
  const pagination = getPaginationParams(req.query);

  // Build filter object from optional query params
  const filters = {
    type: req.query.type as any,
    tag: req.query.tag as string,
    communityId: req.query.communityId as string,
  };

  // Fetch only approved resources matching the filters, paginated
  const result = await resourceService.getApprovedResources(filters, pagination);
  res.status(200).json(new ApiResponse(200, "OK", result));
});

// POST /resources - authenticated user submits a new resource; goes into a pending/review state
export const submitResource = asyncHandler(async (req: Request, res: Response) => {
  const resource = await resourceService.submitResource(req.body, req.user!.userId);
  res.status(201).json(new ApiResponse(201, "Resource submitted for review", resource));
});

// GET /resources/:slug - fetch a single resource by its slug
export const getResource = asyncHandler(async (req: Request, res: Response) => {
  const resource = await resourceService.getResourceBySlug(getParamSlug(req));
  res.status(200).json(new ApiResponse(200, "OK", resource));
});

// PATCH/PUT /resources/:slug - update a resource; service layer enforces ownership/role permissions
export const updateResource = asyncHandler(async (req: Request, res: Response) => {
  const resource = await resourceService.updateResource(
    getParamSlug(req),
    req.body,
    req.user!.userId,
    req.user!.role
  );
  res.status(200).json(new ApiResponse(200, "Resource updated", resource));
});

// DELETE /resources/:slug - delete a resource; service layer enforces ownership/role permissions
export const deleteResource = asyncHandler(async (req: Request, res: Response) => {
  await resourceService.deleteResource(getParamSlug(req), req.user!.userId, req.user!.role);
  res.status(200).json(new ApiResponse(200, "Resource deleted", null));
});

// POST /resources/:slug/approve - moderator/admin approves a pending resource
export const approveResource = asyncHandler(async (req: Request, res: Response) => {
  await resourceService.approveResource(getParamSlug(req), req.user!.userId);
  res.status(200).json(new ApiResponse(200, "Resource approved", null));
});

// POST /resources/:slug/reject - moderator/admin rejects a pending resource, with an optional review note explaining why
export const rejectResource = asyncHandler(async (req: Request, res: Response) => {
  await resourceService.rejectResource(getParamSlug(req), req.user!.userId, req.body.reviewNote);
  res.status(200).json(new ApiResponse(200, "Resource rejected", null));
});

// POST /resources/:slug/view - increments the view count for analytics/popularity tracking
export const incrementView = asyncHandler(async (req: Request, res: Response) => {
  await resourceService.recordView(getParamSlug(req));
  res.status(200).json(new ApiResponse(200, "View recorded", null));
});