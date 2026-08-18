import { Router } from "express";
import * as notificationController from "./notification.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from "./notification.validation.js";

/** Every route requires auth — notifications only ever exist relative to
 *  "my" notifications, no public view. */
const router = Router();

router.get(
  "/",
  authenticate,
  validate(listNotificationsQuerySchema, "query"),
  notificationController.listMyNotifications
);

router.get("/unread-count", authenticate, notificationController.getUnreadCount);

router.patch(
  "/:notificationId/read",
  authenticate,
  validate(notificationIdParamSchema, "params"),
  notificationController.markAsRead
);

router.patch("/read-all", authenticate, notificationController.markAllAsRead);

router.delete(
  "/:notificationId",
  authenticate,
  validate(notificationIdParamSchema, "params"),
  notificationController.deleteNotification
);

export default router;
