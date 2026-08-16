import fs from "fs/promises";
import {
  v2 as cloudinary,
  UploadApiResponse,
} from "cloudinary";

// Side-effect import — this is the only place cloudinary.config() gets
// called. Without it, `cloudinary` above is the raw, unconfigured SDK
// singleton: no cloud_name/api_key/api_secret, and every upload fails
// with "Must supply api_key" regardless of what's actually set in the
// environment, since the config call that would read those env vars
// simply never ran.
import "../config/cloudinary.js";


export const uploadToCloudinary = async (
  localFilePath: string
): Promise<UploadApiResponse | null> => {
  try {
    const response = await cloudinary.uploader.upload(
      localFilePath,
      {
        resource_type: "auto",
      }
    );

    // BUG FIX: this was previously commented out, so every successful
    // upload left its temp file behind on disk (only the failure path
    // below cleaned up). Multer-written temp files need to be removed
    // regardless of outcome.
    try {
      await fs.unlink(localFilePath);
    } catch {}

    return response;
  } catch (error) {
    try {
      await fs.unlink(localFilePath);
    } catch {}

    console.error("Cloudinary Upload Error:", error);

    return null;
  }
};