import * as db from "../models/queries.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.status(200).json({ data: users });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await db.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ data: user });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    const user = await db.createUser(name, username, email, password);
    res.status(201).json({ data: user });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: `${error.meta?.target} already in use` });
    }
    res.status(500).json({ error: "Failed to create user" });
  }
};

export const getPostsByUser = async (req, res) => {
  try {
    const authorId = parseInt(req.params.id);
    const posts = await db.getPostsByUser(authorId);
    res.status(200).json({ data: posts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts for user" });
  }
};
