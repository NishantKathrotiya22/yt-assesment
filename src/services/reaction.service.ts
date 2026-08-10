import { reactionRepository } from '../repositories/reaction.repository';
import { videoRepository } from '../repositories/video.repository';
import { ReactionType } from '../entities/Reaction.entity';
import { ApiError } from '../utils/ApiError';

function bumpCount(videoId: string, type: ReactionType, delta: number) {
  return type === ReactionType.LIKE
    ? videoRepository.incrementLikeCount(videoId, delta)
    : videoRepository.incrementDislikeCount(videoId, delta);
}

export async function setReaction(videoId: string, userId: string, type: ReactionType): Promise<void> {
  const video = await videoRepository.findById(videoId);
  if (!video || video.deletedAt) throw new ApiError('VIDEO_NOT_FOUND');

  const existing = await reactionRepository.findByVideoAndUser(videoId, userId);

  if (!existing) {
    await reactionRepository.create({ videoId, userId, type });
    await bumpCount(videoId, type, 1);
    return;
  }

  if (existing.type === type) return;

  await reactionRepository.updateType(existing.id, type);
  await bumpCount(videoId, existing.type, -1);
  await bumpCount(videoId, type, 1);
}

export async function clearReaction(videoId: string, userId: string): Promise<void> {
  const existing = await reactionRepository.findByVideoAndUser(videoId, userId);
  if (!existing) return;
  await reactionRepository.delete(existing.id);
  await bumpCount(videoId, existing.type, -1);
}
