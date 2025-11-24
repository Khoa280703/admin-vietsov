import { Router } from "express";
import {
  ArticleController,
  createArticleValidation,
  updateArticleValidation,
  listArticlesValidation,
  reviewArticleValidation,
} from "../controllers/article.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// List articles (user sees only their own, admin sees all)
router.get("/", listArticlesValidation, ArticleController.list);

// Get my articles
router.get("/my-articles", listArticlesValidation, ArticleController.myArticles);

// Get article by ID
router.get("/:id", ArticleController.getById);

// Create article
router.post("/", createArticleValidation, ArticleController.create);

// Update article
router.put("/:id", updateArticleValidation, ArticleController.update);

// Delete article
router.delete("/:id", ArticleController.delete);

// Submit for review (user only)
router.post("/:id/submit", ArticleController.submit);

// Approve article (admin only)
router.post("/:id/approve", authorize("admin"), reviewArticleValidation, ArticleController.approve);

// Reject article (admin only)
router.post("/:id/reject", authorize("admin"), reviewArticleValidation, ArticleController.reject);

// Publish article (admin or user if approved)
router.post("/:id/publish", ArticleController.publish);

export default router;

