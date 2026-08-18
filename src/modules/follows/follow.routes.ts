import { Router } from "express";
import * as followController from "./follow.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  userIdParamSchema,
  listFollowersQuerySchema,
  listFollowingQuerySchema,
} from "./follow.validation.js";

/**
 * Mount at /api/v1/users — these all read as sub-resources of a user
 * (/users/:userId/followers, /users/:userId/follow), consistent with how
 * a "follow" is fundamentally about the USER being followed, not a
 * resource this module owns a URL namespace for on its own.
 */
const router = Router();

router.post(
  "/:userId/follow",
  authenticate,
  validate(userIdParamSchema, "params"),
  followController.followUser
);

router.delete(
  "/:userId/follow",
  authenticate,
  validate(userIdParamSchema, "params"),
  followController.unfollowUser
);

router.get(
  "/:userId/follow-status",
  authenticate,
  validate(userIdParamSchema, "params"),
  followController.checkIsFollowing
);

router.get(
  "/:userId/follow-counts",
  validate(userIdParamSchema, "params"),
  followController.getFollowCounts
);

router.get(
  "/:userId/followers",
  validate(userIdParamSchema, "params"),
  validate(listFollowersQuerySchema, "query"),
  followController.listFollowers
);

router.get(
  "/:userId/following",
  validate(userIdParamSchema, "params"),
  validate(listFollowingQuerySchema, "query"),
  followController.listFollowing
);

export default router;
