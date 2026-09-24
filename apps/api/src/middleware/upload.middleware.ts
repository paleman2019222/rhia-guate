import { randomUUID } from "node:crypto";
import path from "node:path";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const cvUpload = multer({
  storage: multer.diskStorage({
    destination: path.resolve(process.cwd(), "uploads"),
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) return callback(new ApiError(422, "Only PDF, DOC and DOCX CV files are accepted"));
    callback(null, true);
  },
});
