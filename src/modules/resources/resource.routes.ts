import { Router } from "express";
import * as resourceController from "./resource.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { UserRole } from "../users/user.model.js";
import {
  submitResourceSchema,
  updateResourceSchema,
  reviewResourceSchema,
} from "./resource.validation.js";

const router = Router();

// Public: list approved resources (with filtering/pagination)
router.get("/", resourceController.getResources);

// Authenticated: submit a new resource (validated against submitResourceSchema), goes into review
router.post("/", authenticate, validate(submitResourceSchema), resourceController.submitResource);

// Public: fetch a single resource by slug
router.get("/:slug", resourceController.getResource);

// Authenticated: update a resource (ownership/role check happens in the service layer)
router.patch(
  "/:slug",
  authenticate,
  validate(updateResourceSchema),
  resourceController.updateResource
);

// Authenticated: delete a resource (ownership/role check happens in the service layer)
router.delete("/:slug", authenticate, resourceController.deleteResource);

// Admin/Moderator only: approve a pending resource
router.patch(
  "/:slug/approve",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.MODERATOR),
  resourceController.approveResource
);

// Admin/Moderator only: reject a pending resource, with a review note (validated against reviewResourceSchema)
router.patch(
  "/:slug/reject",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.MODERATOR),
  validate(reviewResourceSchema),
  resourceController.rejectResource
);

// Public: record a view on a resource
router.post("/:slug/view", resourceController.incrementView);

export default router;