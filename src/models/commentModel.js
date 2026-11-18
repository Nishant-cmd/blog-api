import { prisma } from '../../lib/prisma.js';

async function createComment(content, authorId, postId) {
  return await prisma.comment.create({
    data: {
      content,
      author: { connect: { id: authorId } },
      post: { connect: { id: postId } },
    },
    include: {
      author: { select: { id: true, name: true, username: true } },
    },
  });
}

async function getCommentsByPost(postId) {
  return await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, name: true, username: true } },
    },
  });
}

async function getCommentsByUser(authorId) {
  return await prisma.comment.findMany({ where: { authorId } });
}

async function deleteComment(commentId, postId) {
  const result = await prisma.comment.deleteMany({ where: { id: commentId, postId } });
  return result.count;
}

async function updateComment(commentId, postId, content) {
  const result = await prisma.comment.updateMany({
    where: { id: commentId, postId },
    data: { content },
  });
  if (!result.count) return null;
  return await prisma.comment.findUnique({
    where: { id: commentId },
    include: { author: { select: { id: true, name: true, username: true } } },
  });
}

export {
  createComment,
  getCommentsByPost,
  getCommentsByUser,
  deleteComment,
  updateComment,
};
