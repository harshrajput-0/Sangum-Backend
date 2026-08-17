import multer, {FileFilterCallback} from "multer";
import os from "os";
import path from "path";
import fs from "fs";
import { Request } from "express";
import crypto from "crypto";

// Create Temporary Directory
const UPLOAD_TMP_DIR = path.join(os.tmpdir(), "sangam-uploads");
fs.mkdirSync(UPLOAD_TMP_DIR, { recursive: true });


const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);



const storage = multer.diskStorage({
  destination: function (_req, file, cb) {
    cb(null, UPLOAD_TMP_DIR)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;     
    cb(null, uniqueName);
  }
})


const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new Error("Only JPEG, PNG and WEBP images are allowed"));
    return;
  }
  cb(null, true);
};


// Single-file avatar upload, 5MB cap. Used as: uploadAvatar.single("avatar")
export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});


// Upload Cover
export const uploadCover = multer({
  storage,
  fileFilter,
  limits: {fileSize: 5 * 1024 * 124 }, // 8MB
})

const upload = multer({ storage: storage })