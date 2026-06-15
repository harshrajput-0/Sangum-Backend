import fs from "fs/promises";
import {
  v2 as cloudinary,
  UploadApiResponse,
} from "cloudinary";




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

    // await fs.unlink(localFilePath);

    return response;
  } catch (error) {
    try {
      await fs.unlink(localFilePath);
    } catch {}

    console.error("Cloudinary Upload Error:", error);

    return null;
  }
};

