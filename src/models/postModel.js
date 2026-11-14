import { prisma } from '../../lib/prisma.js';

async function createPost(title, slug, content, authorId) {
  return await prisma.post.create({
    data: {
      title,
      slug,
      content,
      author: {
        connect: {
          id: authorId,
        },
      },
    },
  });
}
async function getPublishedPosts() {
  return await prisma.post.findMany({
    where: {
      published: true,
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: 10,
  });
}
async function getPostById(postId) {
  return await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });
}
async function getPostBySlug(slug) {
  return await prisma.post.findUnique({
    where: {
      slug,
    },
  });
}
export { createPost, getPublishedPosts, getPostById, getPostBySlug };