import * as db from "../models/queries.js";

export const getPublishedPosts = async (req, res) => {
  try {
    const posts = await db.getPublishedPosts();
    res.status(200).json({ data: posts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = req.user.role === "ADMIN"
      ? await db.getAllPosts()
      : await db.getPostsByUser(req.user.id);
    res.status(200).json({ data: posts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

export const getPostById = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await db.getPostById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const canReadDraft = req.user && (req.user.role === "ADMIN" || req.user.id === post.authorId);
    if (!post.published && !canReadDraft) return res.status(404).json({ error: "Post not found" });
    res.status(200).json({ data: post });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, slug, content } = req.body;
    const post = await db.createPost(title, slug, content, req.user.id);
    res.status(201).json({ data: post });
  } catch (error) {
    if (error.code === "P2002")
      return res.status(409).json({ error: "A post with this slug already exists" });
    if (error.code === "P2003")
      return res.status(404).json({ error: "Author not found" });
    res.status(500).json({ error: "Failed to create post" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { title, content, slug, published } = req.body;

    const data = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (slug !== undefined) data.slug = slug;
    if (published !== undefined) data.published = published;

    const post = await db.updatePost(postId, data);
    res.status(200).json({ data: post });
  } catch (error) {
    if (error.code === "P2025")
      return res.status(404).json({ error: "Post not found" });
    res.status(500).json({ error: "Failed to update post" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    await db.deletePost(postId);
    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    if (error.code === "P2025")
      return res.status(404).json({ error: "Post not found" });
    res.status(500).json({ error: "Failed to delete post" });
  }
};
