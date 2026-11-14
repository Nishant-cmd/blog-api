import * as db from "../models/queries.js";

export const getPublishedPosts = async (req, res) => {
  try {
    const posts = await db.getPublishedPosts();
    res.status(200).json({ data: posts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

export const getPostById = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await db.getPostById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json({ data: post });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, slug, content, authorId } = req.body;
    const post = await db.createPost(title, slug, content, authorId);
    res.status(201).json({ data: post });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "A post with this slug already exists" });
    }
    if (error.code === "P2003") {
      return res.status(404).json({ error: "Author not found" });
    }
    res.status(500).json({ error: "Failed to create post" });
  }
};
