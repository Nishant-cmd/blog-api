import { Router } from "express";
import * as postController from "../controllers/postController.js";
import * as commentController from "../controllers/commentController.js";
import {
  validateCreatePost,
  validatePostId,
  validateCreateComment,
} from "../middlewares/validation.js";

const router = Router();

router.get("/", postController.getPublishedPosts);

router.post("/", validateCreatePost, postController.createPost);

router.get("/:id", validatePostId, postController.getPostById);

router.get(
  "/:postId/comments",
  validateCreateComment.slice(0, 1),
  commentController.getCommentsByPost,
);

router.post(
  "/:postId/comments",
  validateCreateComment,
  commentController.createComment,
);

export default router;
