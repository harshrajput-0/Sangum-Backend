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


// getTagBYSlug


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


// searchTag
// updateTag
// deleteTag
// markOfficial
// unmarkOfficial

