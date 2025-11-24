import { Router } from "express";
import { UploadController } from "../controllers/upload.controller";
import { authenticate } from "../middleware/auth.middleware";
import { upload } from "../services/upload.service";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Upload image
router.post("/image", upload.single("image"), UploadController.uploadImage);

export default router;

