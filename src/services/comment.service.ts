import { commentRepository } from '../repositories/comment.repository';
import { videoRepository } from '../repositories/video.repository';
import { Comment } from '../entities/Comment.entity';
import { ApiError } from '../utils/ApiError';

function toPublicComment(comment: Comment) {
  return {
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt,
    author: {
      id: comment.user.id,
      name: comment.user.name,
      channelName: comment.user.channelName,
      avatarUrl: comment.user.avatarUrl,
    },
  };
}

async function assertVideoExists(videoId: string): Promise<void> {
  const video = await videoRepository.findById(videoId);
  if (!video || video.deletedAt) throw new ApiError('VIDEO_NOT_FOUND');
}

export async function listComments(videoId: string, page: number, limit: number) {
  await assertVideoExists(videoId);
  const { items, total } = await commentRepository.listByVideo(videoId, page, limit);
  return { items: items.map(toPublicComment), total };
}

export async function createComment(videoId: string, userId: string, text: string) {
  await assertVideoExists(videoId);

  const comment = await commentRepository.create({ videoId, userId, text });
  await videoRepository.incrementCommentCount(videoId, 1);

  return toPublicComment((await commentRepository.findById(comment.id)) as Comment);
}

export async function deleteComment(id: string, requester: { id: string; role: string }): Promise<void> {
  const comment = await commentRepository.findById(id);
  if (!comment) throw new ApiError('COMMENT_NOT_FOUND');
  if (comment.userId !== requester.id && requester.role !== 'ADMIN') throw new ApiError('AUTH_FORBIDDEN');

  await commentRepository.delete(id);
  await videoRepository.incrementCommentCount(comment.videoId, -1);
}
