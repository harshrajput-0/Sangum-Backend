import { Router } from "express";
import * as tagController from "./tag.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  createTagSchema,
  updateTagSchema,
  listTagsQuerySchema,
  searchTagsQuerySchema,
  tagIdParamSchema,
} from "./tag.validation.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * ROUTE ORDER — /search MUST precede /:slug
 * ─────────────────────────────────────────────────────────────────────────
 * Same reasoning as every other module with a slug-based detail route.
 * ─────────────────────────────────────────────────────────────────────────
 */

const router = Router();

router.post("/", authenticate, validate(createTagSchema), tagController.createTag);

router.get("/", validate(listTagsQuerySchema, "query"), tagController.listTags);
router.get("/search", validate(searchTagsQuerySchema, "query"), tagController.searchTags);

router.get("/:slug", tagController.getTagBySlug);

router.patch(
  "/:tagId",
  authenticate,
  validate(tagIdParamSchema, "params"),
  validate(updateTagSchema),
  tagController.updateTag
);

router.delete(
  "/:tagId",
  authenticate,
  validate(tagIdParamSchema, "params"),
  tagController.deleteTag
);

router.post(
  "/:tagId/official",
  authenticate,
  validate(tagIdParamSchema, "params"),
  tagController.markOfficial
);

router.delete(
  "/:tagId/official",
  authenticate,
  validate(tagIdParamSchema, "params"),
  tagController.unmarkOfficial
);

export default router;
