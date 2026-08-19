import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as tagService from "./tag.service.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SAME RULE AS auth.controller.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Controllers ONLY: read the request, call exactly one service function,
 * shape the response. Every decision (moderator-only checks, usage-count
 * delete guard) lives in tag.service.ts.
 * ─────────────────────────────────────────────────────────────────────────
 */

export const createTag = asyncHandler(async (req: Request, res: Response) => {
  const tag = await tagService.createTag(req.user!.userId, req.body);

  res.status(201).json(new ApiResponse(201, "Tag created", tag));
});

export const getTagBySlug = asyncHandler(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const tag = await tagService.getTagBySlug(slug);

  res.status(200).json(new ApiResponse(200, "OK", tag));
});

export const listTags = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as {
    page: number;
    limit: number;
    isOfficial?: boolean;
    sort: "popular" | "newest" | "alphabetical";
  };
  const result = await tagService.listTags(query);

  res.status(200).json(new ApiResponse(200, "OK", result));
});

export const searchTags = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as { q: string; page: number; limit: number };
  const result = await tagService.searchTags(query);

  res.status(200).json(new ApiResponse(200, "OK", result));
});

export const updateTag = asyncHandler(async (req: Request, res: Response) => {
  const tagId = req.params.tagId as string;
  const tag = await tagService.updateTag(tagId, req.user!.role, req.body);

  res.status(200).json(new ApiResponse(200, "Tag updated", tag));
});

export const deleteTag = asyncHandler(async (req: Request, res: Response) => {
  const tagId = req.params.tagId as string;

  await tagService.deleteTag(tagId, req.user!.role);

  res.status(200).json(new ApiResponse(200, "Tag deleted", null));
});

export const markOfficial = asyncHandler(async (req: Request, res: Response) => {
  const tagId = req.params.tagId as string;

  const tag = await tagService.markOfficial(tagId, req.user!.role);

  res.status(200).json(new ApiResponse(200, "Tag marked official", tag));
});

export const unmarkOfficial = asyncHandler(async (req: Request, res: Response) => {
  const tagId = req.params.tagId as string;

  const tag = await tagService.unmarkOfficial(tagId, req.user!.role);

  res.status(200).json(new ApiResponse(200, "Tag unmarked as official", tag));
});
