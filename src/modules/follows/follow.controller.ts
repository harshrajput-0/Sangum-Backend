import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as followService from "./follow.service.js";


export const followUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  await followService.followUser(req.user!.userId, userId);

  res.status(201).json(new ApiResponse(201, "Followed", null));
});

export const unfollowUser = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    await followService.unfollowUser(req.user!.userId, userId);

    res.status(200).json(new ApiResponse(200, "Unfollowed", null));
  },
);

export const checkIsFollowing = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const isFollowing = await followService.checkIsFollowing(
      req.user!.userId,
      userId,
    );

    res.status(200).json(new ApiResponse(200, "OK", { isFollowing }));
  },
);

export const getFollowCounts = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const counts = await followService.getFollowCounts(userId);

    res.status(200).json(new ApiResponse(200, "OK", counts));
  },
);

export const listFollowers = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const { page, limit } = req.query as unknown as {
      page: number;
      limit: number;
    };
    const result = await followService.listFollowers(userId, page, limit);

    res.status(200).json(new ApiResponse(200, "OK", result));
  },
);

export const listFollowing = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const { page, limit } = req.query as unknown as {
      page: number;
      limit: number;
    };
    const result = await followService.listFollowing(userId, page, limit);

    res.status(200).json(new ApiResponse(200, "OK", result));
  },
);
