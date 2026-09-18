import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * WHY MEMORY STORAGE, NOT DISK STORAGE
 * ─────────────────────────────────────────────────────────────────────────
 * Multer can save uploads to disk first, then you'd read the file back
 * to forward it to Cloudinary. memoryStorage() skips that — the file
 * arrives as a Buffer directly on req.file.buffer, which is exactly
 * what uploadToCloudinary.ts expects to pipe into a stream. No temp
 * files to clean up, no disk I/O for something we're about to forward
 * elsewhere anyway.
 *
 * fileFilter rejects disallowed MIME types BEFORE the file is even
 * fully received — this is the first line of defense; media.service.ts
 * does a second, more specific check per upload context (e.g. avatars
 * only accept images, resources might accept documents too).
 * ─────────────────────────────────────────────────────────────────────────
 */

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per file

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
  cb(null, true);
};

const baseUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

/**
 * uploadSingle("avatar") → expects req.file to be populated
 * Used on routes that accept exactly one file (avatar, banner, single
 * image post).
 */
export const uploadSingle = (fieldName: string) => baseUpload.single(fieldName);

/**
 * uploadMultiple("images", 4) → expects req.files to be populated
 * Used on routes that accept several files at once (image-gallery posts).
 */
export const uploadMultiple = (fieldName: string, maxCount: number) =>
  baseUpload.array(fieldName, maxCount);

/**
 * Multer throws its own error types (e.g. LIMIT_FILE_SIZE) that aren't
 * ApiError instances — error.middleware.ts checks for this and converts
 * them, but routes that want a friendlier message at the point of
 * failure can wrap their upload middleware with this instead.
 */
export const handleUploadError = (err: unknown) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      throw ApiError.badRequest("File too large — max size is 10MB");
    }
    throw ApiError.badRequest(`Upload error: ${err.message}`);
  }
  throw err;
};
