import * as db from "../models/queries.js";

export const getCommentsByPost = async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const comments = await db.getCommentsByPost(postId);
    res.status(200).json({ data: comments });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

export const createComment = async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const { content, authorId } = req.body;
    const comment = await db.createComment(content, authorId, postId);
    res.status(201).json({ data: comment });
  } catch (error) {
    if (error.code === "P2003") {
      return res.status(404).json({ error: "Post or author not found" });
    }
    res.status(500).json({ error: "Failed to create comment" });
  }
};
