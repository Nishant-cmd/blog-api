import { Router } from "express";
import * as postController from "../controllers/postController.js";
import * as commentController from "../controllers/commentController.js";
import {
  validateCreatePost,
  validateUpdatePost,
  validatePostId,
  validateCreateComment,
  validateCommentRoute,
  validateUpdateComment,
} from "../middlewares/validation.js";
import requireAuth, { optionalAuth } from "../middlewares/requireAuth.js";
import requirePostOwner from "../middlewares/requirePostOwner.js";

const router = Router();

router.get("/", postController.getPublishedPosts);
router.get("/:id", optionalAuth, validatePostId, postController.getPostById);
router.get(
  "/:postId/comments",
  optionalAuth,
  validateCreateComment.slice(0, 1),
  commentController.getCommentsByPost,
);

router.get("/admin/all", requireAuth, postController.getAllPosts);

router.post("/", requireAuth, validateCreatePost, postController.createPost);
router.put("/:id", requireAuth, validateUpdatePost, requirePostOwner, postController.updatePost);
router.delete("/:id", requireAuth, validatePostId, requirePostOwner, postController.deletePost);

router.post(
  "/:postId/comments",
  requireAuth,
  validateCreateComment,
  commentController.createComment,
);
router.put(
  "/:postId/comments/:commentId",
  requireAuth,
  validateCommentRoute,
  requirePostOwner,
  validateUpdateComment,
  commentController.updateComment,
);
router.delete(
  "/:postId/comments/:commentId",
  requireAuth,
  validateCommentRoute,
  requirePostOwner,
  commentController.deleteComment,
);

export default router;
