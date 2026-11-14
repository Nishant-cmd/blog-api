import { prisma } from '../../lib/prisma.js';

async function createComment(content, authorId, postId) {
  return await prisma.comment.create({
    data: {
      content,
      author: {
        connect: {
          id: authorId,
        },
      },
      post: {
        connect: {
          id: postId,
        },
      },
    },
  });
}

async function getCommentsByPost(postId) {
  return await prisma.comment.findMany({
    where: {
      postId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
async function getCommentsByUser(authorId) {
  return await prisma.comment.findMany({
    where: {
      authorId,
    },
  });
}

export { createComment, getCommentsByPost, getCommentsByUser };
