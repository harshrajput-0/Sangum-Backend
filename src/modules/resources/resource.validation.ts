import { z } from "zod";
import { ResourceType } from "./resource.model.js";

// Validation for submitting new resource
export const submitResourceSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(1).max(1000),
  url: z.string().trim().url(),
  type: z.nativeEnum(ResourceType),
  communityId: z.string().optional(),
  tags: z.array(z.string().trim().min(1)).max(10).optional(),
  isPaywalled: z.boolean().optional(),
});

// Validation for existing resource
export const updateResourceSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().min(1).max(1000).optional(),
  tags: z.array(z.string().trim().min(1)).max(10).optional(),
});

// Validation for admin/moderator review
export const reviewResourceSchema = z.object({
  reviewNote: z.string().trim().max(500).optional(),
});