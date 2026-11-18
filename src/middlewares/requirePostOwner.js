import * as db from "../models/queries.js";

const requirePostOwner = async (req, res, next) => {
  try {
    const postId = Number(req.params.id || req.params.postId);
    const post = await db.getPostById(postId);

    if (!post) return res.status(404).json({ error: "Post not found" });
    if (req.user.role !== "ADMIN" && post.authorId !== req.user.id) {
      return res.status(403).json({ error: "You can only manage your own posts" });
    }

    req.post = post;
    return next();
  } catch (error) {
    return next(error);
  }
};

export default requirePostOwner;
