import { Request, Response } from "express";
import { UploadService } from "../services/upload.service";
import { AppError } from "../middleware/error.middleware";

export class UploadController {
  static async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError("No file uploaded", 400);
      }

      const url = UploadService.getFileUrl(req.file.filename);

      res.json({
        url,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
}

