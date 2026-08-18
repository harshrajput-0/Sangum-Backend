import { Router } from "express";
import * as mediaController from "./media.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  createMediaSchema,
  updateMediaSchema,
  listMyMediaQuerySchema,
  mediaIdParamSchema,
} from "./media.validation.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * ROUTE ORDER — /me MUST precede /:mediaId
 * ─────────────────────────────────────────────────────────────────────────
 * Same reasoning as every other module with a dynamic detail route.
 * ─────────────────────────────────────────────────────────────────────────
 */

const router = Router();

router.post("/", authenticate, validate(createMediaSchema), mediaController.createMedia);

router.get(
  "/me",
  authenticate,
  validate(listMyMediaQuerySchema, "query"),
  mediaController.listMyMedia
);

router.get(
  "/:mediaId",
  validate(mediaIdParamSchema, "params"),
  mediaController.getMediaById
);

router.patch(
  "/:mediaId",
  authenticate,
  validate(mediaIdParamSchema, "params"),
  validate(updateMediaSchema),
  mediaController.updateMedia
);

router.delete(
  "/:mediaId",
  authenticate,
  validate(mediaIdParamSchema, "params"),
  mediaController.deleteMedia
);

export default router;
