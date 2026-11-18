import { prisma } from "../../lib/prisma.js";
import bcrypt from "bcryptjs";

async function createUser(name, username, email, password) {
  const hashedPassword = await bcrypt.hash(password, 12);
  return await prisma.user.create({
    data: {
      name,
      username,
      email,
      password: hashedPassword,
    },
    select: { id: true, name: true, username: true, email: true, role: true },
  });
}

async function getAllUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
    },
  });
}

async function getUserById(userId) {
  return await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
    },
  });
}
async function getUserByEmail(email) {
  return await prisma.user.findUnique({
    where: {
      email,
    },
  });
}

async function rehashUserPassword(userId, password) {
  const hashedPassword = await bcrypt.hash(password, 12);
  return await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}

async function getPostsByUser(authorId) {
  return await prisma.post.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, username: true } },
      _count: { select: { comments: true } },
    },
  });
}

export {
  createUser,
  getAllUsers,
  getUserById,
  getUserByEmail,
  getPostsByUser,
  rehashUserPassword,
};
