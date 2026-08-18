import { ApiError } from "../../utils/ApiError.js";
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as notificationService from "./notification.service.js";

export const listMyNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, unreadOnly } = req.query as unknown as {
      page: number;
      limit: number;
      unreadOnly?: boolean;
    };
    const result = await notificationService.listMyNotifications(
      req.user!.userId,
      unreadOnly,
      page,
      limit,
    );

    res.status(200).json(new ApiResponse(200, "OK", result));
  },
);

export const getUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!.userId);

    res.status(200).json(new ApiResponse(200, "OK", { count }));
  },
);

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { notificationId } = req.params;

  if (!notificationId || Array.isArray(notificationId)) {
    throw ApiError.badRequest("Invalid notification ID");
  }
  await notificationService.markAsRead(notificationId, req.user!.userId);

  res.status(200).json(new ApiResponse(200, "Marked as read", null));
});

export const markAllAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    await notificationService.markAllAsRead(req.user!.userId);

    res
      .status(200)
      .json(new ApiResponse(200, "All notifications marked as read", null));
  },
);

export const deleteNotification = asyncHandler(
  async (req: Request, res: Response) => {
    const { notificationId } = req.params;

    if (!notificationId || Array.isArray(notificationId)) {
      throw ApiError.badRequest("Invalid notification ID");
    }
    await notificationService.deleteNotification(
      notificationId,
      req.user!.userId,
    );

    res.status(200).json(new ApiResponse(200, "Notification deleted", null));
  },
);
