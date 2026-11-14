import { prisma } from "../../lib/prisma.js";

async function createUser(name, username, email, password) {
  return await prisma.user.create({
    data: {
      name,
      username,
      email,
      password,
    },
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

async function getPostsByUser(authorId) {
  return await prisma.post.findMany({
    where: {
      authorId,
    },
  });
}

export { createUser, getAllUsers, getUserById, getUserByEmail, getPostsByUser };
