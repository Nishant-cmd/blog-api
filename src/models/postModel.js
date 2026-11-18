import { prisma } from '../../lib/prisma.js';

async function createPost(title, slug, content, authorId) {
  return await prisma.post.create({
    data: {
      title,
      slug,
      content,
      author: { connect: { id: authorId } },
    },
  });
}

async function getPublishedPosts() {
  return await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    include: {
      author: { select: { id: true, name: true, username: true } },
      _count: { select: { comments: true } },
    },
  });
}

async function getAllPosts() {
  return await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, name: true, username: true } },
      _count: { select: { comments: true } },
    },
  });
}

async function getPostById(postId) {
  return await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, name: true, username: true } },
    },
  });
}

async function getPostBySlug(slug) {
  return await prisma.post.findUnique({ where: { slug } });
}

async function updatePost(postId, data) {
  if (data.published === true) {
    data.publishedAt = data.publishedAt ?? new Date();
  }
  if (data.published === false) {
    data.publishedAt = null;
  }
  return await prisma.post.update({
    where: { id: postId },
    data,
  });
}

async function deletePost(postId) {
  return await prisma.post.delete({ where: { id: postId } });
}

export {
  createPost,
  getPublishedPosts,
  getAllPosts,
  getPostById,
  getPostBySlug,
  updatePost,
  deletePost,
};
