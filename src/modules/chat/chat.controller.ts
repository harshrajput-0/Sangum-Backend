import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { getPaginationParams } from "../../utils/pagination.js";
import * as chatService from "./chat.service.js";

const getParamId = (req: Request) => {
  const { id } = req.params;

  if (typeof id !== "string") {
    throw ApiError.badRequest("Invalid ID");
  }

  return id;
};

// =====| GET CONVERSATIONS |-------------------------------------------
export const getConversations = asyncHandler(
  async (req: Request, res: Response) => {
    const pagination = getPaginationParams(req.query);
    const conversations = await chatService.getUserConversations(
      req.user!.userId,
      pagination,
    );
    res.status(200).json(new ApiResponse(200, "OK", conversations));
  },
);

// =====| CREATE CONVERSATIONS |-------------------------------------------
export const createConversation = asyncHandler(
  async (req: Request, res: Response) => {
    const conversation = await chatService.createConversation(
      req.body,
      req.user!.userId,
    );
    res
      .status(201)
      .json(new ApiResponse(201, "Conversation created", conversation));
  },
);

// =====| GET CONVERSATION |---------------------------------------------
export const getConversation = asyncHandler(
  async (req: Request, res: Response) => {
    const conversation = await chatService.getConversationById(
      getParamId(req),
      req.user!.userId,
    );
    res.status(200).json(new ApiResponse(200, "OK", conversation));
  },
);

// =====| GET MESSAGES |--------------------------------------------------------
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 30, 50);
  const messages = await chatService.getMessages(
    getParamId(req),
    req.user!.userId,
    req.query.cursor as string | undefined,
    limit,
  );
  res.status(200).json(new ApiResponse(200, "OK", messages));
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await chatService.sendMessage(
    getParamId(req),

    req.user!.userId,
    req.body,
  );
  res.status(201).json(new ApiResponse(201, "Message sent", message));
});

export const editMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await chatService.editMessage(
    getParamId(req),

    req.user!.userId,
    req.body.content,
  );
  res.status(200).json(new ApiResponse(200, "Message updated", message));
});

export const deleteMessage = asyncHandler(
  async (req: Request, res: Response) => {
    await chatService.deleteMessage(getParamId(req), req.user!.userId);
    res.status(200).json(new ApiResponse(200, "Message deleted", null));
  },
);

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.body.messageId) throw ApiError.badRequest("messageId is required");
  await chatService.markConversationRead(
    getParamId(req),
    req.user!.userId,
    req.body.messageId,
  );
  res.status(200).json(new ApiResponse(200, "Marked as read", null));
});

export const addParticipant = asyncHandler(
  async (req: Request, res: Response) => {
    await chatService.addParticipant(
      getParamId(req),
      req.user!.userId,
      req.body.userId,
    );
    res.status(200).json(new ApiResponse(200, "Participant added", null));
  },
);

export const removeParticipant = asyncHandler(
  async (req: Request, res: Response) => {
    await chatService.removeParticipant(
      getParamId(req),
      req.user!.userId,
      req.params.userId as string,
    );
    res.status(200).json(new ApiResponse(200, "Participant removed", null));
  },
);

export const leaveConversation = asyncHandler(
  async (req: Request, res: Response) => {
    await chatService.leaveConversation(getParamId(req), req.user!.userId);
    res.status(200).json(new ApiResponse(200, "Left conversation", null));
  },
);
