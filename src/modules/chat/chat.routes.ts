import { Router } from "express";
import * as chatController from "./chat.controller.js"
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { uploadSingle } from "../../middlewares/upload.middleware.js";
import {
  createConversationSchema,
  sendMessageSchema,
  updateConversationSchema,
} from "./chat.validation.js";

const router = Router();

// Every chat route requires auth — there's no anonymous chat access.
router.use(authenticate);

router.get("/conversations", chatController.getConversations);
router.post(
  "/conversations",
  validate(createConversationSchema),
  chatController.createConversation
);
router.get("/conversations/:id", chatController.getConversation);

router.get("/conversations/:id/messages", chatController.getMessages);
router.post(
  "/conversations/:id/messages",
  uploadSingle("file"),
  validate(sendMessageSchema),
  chatController.sendMessage
);

router.patch("/messages/:id", validate(sendMessageSchema), chatController.editMessage);
router.delete("/messages/:id", chatController.deleteMessage);

router.patch("/conversations/:id/read", chatController.markAsRead);

router.post("/conversations/:id/participants", chatController.addParticipant);
router.delete("/conversations/:id/participants/:userId", chatController.removeParticipant);
router.delete("/conversations/:id/leave", chatController.leaveConversation);

