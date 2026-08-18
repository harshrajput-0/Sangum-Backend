import { Router } from "express";
import * as tagController from "./tag.controller.js"
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";

import { createTagSchema } from "./tag.validation.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * ROUTE ORDER — /search MUST precede /:slug
 * ─────────────────────────────────────────────────────────────────────────
 * Same reasoning as every other module with a slug-based detail route.
 * ─────────────────────────────────────────────────────────────────────────
 */

const router = Router();

router.post("/", authenticate, validate(createTagSchema), tagController.createTag);


export default router;