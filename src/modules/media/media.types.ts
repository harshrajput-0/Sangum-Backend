import { MediaType, MediaContext } from "./media.model.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SCOPE NOTE — see media.service.ts's header comment for the full
 * reasoning. Short version: `uploadToCloudinary.ts` and
 * `upload.middleware.ts` (Multer) don't exist yet, so createMedia below
 * accepts an ALREADY-UPLOADED file's metadata directly rather than
 * handling multipart file upload itself — the same scoping decision
 * already made for avatar/banner in the users module.
 * ─────────────────────────────────────────────────────────────────────────
 */

// ── Request payloads ─────────────────────────────────────────────────────

export interface CreateMediaPayload {
  url: string;
  publicId: string;
  type: MediaType;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  altText?: string;
  context: MediaContext;
}

export interface UpdateMediaPayload {
  altText?: string; // "" clears it — the only field that's ever
                     // meaningfully editable after upload; everything
                     // else describes the uploaded file itself.
}

export interface ListMyMediaQuery {
  page: number;
  limit: number;
  context?: MediaContext;
  type?: MediaType;
}

// ── Response shapes ──────────────────────────────────────────────────────

export interface MediaResponse {
  _id: string;
  uploadedBy: string;
  url: string;
  type: MediaType;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  altText: string | null;
  context: MediaContext;
  createdAt: Date;
}

export interface PaginationMetaResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedMedia {
  media: MediaResponse[];
  pagination: PaginationMetaResponse;
}
