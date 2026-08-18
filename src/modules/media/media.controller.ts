import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as mediaService from "./media.service.js";
import { MediaType, MediaContext } from "./media.model.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SAME RULE AS auth.controller.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Controllers ONLY: read the request, call exactly one service function,
 * shape the response.
 * ─────────────────────────────────────────────────────────────────────────
 */

export const createMedia = asyncHandler(async (req: Request, res: Response) => {
  const media = await mediaService.createMedia(req.user!.userId, req.body);

  res.status(201).json(new ApiResponse(201, "Media recorded", media));
});

export const getMediaById = asyncHandler(
  async (req: Request, res: Response) => {
    const mediaId = req.params.mediaId as string;

    const media = await mediaService.getMediaById(mediaId);

    res.status(200).json(new ApiResponse(200, "OK", media));
  },
);

export const listMyMedia = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as {
    page: number;
    limit: number;
    context?: MediaContext;
    type?: MediaType;
  };
  const result = await mediaService.listMyMedia(req.user!.userId, query);

  res.status(200).json(new ApiResponse(200, "OK", result));
});

export const updateMedia = asyncHandler(async (req: Request, res: Response) => {
  const mediaId = req.params.mediaId as string;

  const media = await mediaService.updateMedia(
    mediaId,
    req.user!.userId,
    req.body,
  );

  res.status(200).json(new ApiResponse(200, "Media updated", media));
});

export const deleteMedia = asyncHandler(async (req: Request, res: Response) => {
  const mediaId = req.params.mediaId as string;

  await mediaService.deleteMedia(mediaId, req.user!.userId, req.user!.role);

  res.status(200).json(new ApiResponse(200, "Media deleted", null));
});
