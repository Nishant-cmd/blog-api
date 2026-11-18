import * as db from "../models/queries.js";

export const getCommentsByPost = async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const post = await db.getPostById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const canReadDraft = req.user && (req.user.role === "ADMIN" || req.user.id === post.authorId);
    if (!post.published && !canReadDraft) return res.status(404).json({ error: "Post not found" });
    const comments = await db.getCommentsByPost(postId);
    res.status(200).json({ data: comments });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

export const createComment = async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const post = await db.getPostById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const canCommentOnDraft = req.user.role === "ADMIN" || req.user.id === post.authorId;
    if (!post.published && !canCommentOnDraft) {
      return res.status(404).json({ error: "Post not found" });
    }
    const { content } = req.body;
    const comment = await db.createComment(content, req.user.id, postId);
    res.status(201).json({ data: comment });
  } catch (error) {
    if (error.code === "P2003")
      return res.status(404).json({ error: "Post or author not found" });
    res.status(500).json({ error: "Failed to create comment" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const deletedCount = await db.deleteComment(commentId, parseInt(req.params.postId));
    if (!deletedCount) return res.status(404).json({ error: "Comment not found" });
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    if (error.code === "P2025")
      return res.status(404).json({ error: "Comment not found" });
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

export const updateComment = async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const { content } = req.body;
    const comment = await db.updateComment(commentId, parseInt(req.params.postId), content);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    res.status(200).json({ data: comment });
  } catch (error) {
    if (error.code === "P2025")
      return res.status(404).json({ error: "Comment not found" });
    res.status(500).json({ error: "Failed to update comment" });
  }
};
