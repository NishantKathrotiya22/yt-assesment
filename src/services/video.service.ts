import { videoRepository, VideoSort } from '../repositories/video.repository';
import { viewEventRepository } from '../repositories/view-event.repository';
import { reactionRepository } from '../repositories/reaction.repository';
import { Video, VideoCategory } from '../entities/Video.entity';
import { ApiError } from '../utils/ApiError';

const VIEW_DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

function toPublicVideo(video: Video) {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    videoKey: video.videoKey,
    thumbnailKey: video.thumbnailKey,
    category: video.category,
    viewCount: video.viewCount,
    likeCount: video.likeCount,
    dislikeCount: video.dislikeCount,
    commentCount: video.commentCount,
    createdAt: video.createdAt,
    owner: {
      id: video.owner.id,
      name: video.owner.name,
      channelName: video.owner.channelName,
      avatarKey: video.owner.avatarKey,
    },
  };
}

async function getExistingVideo(id: string): Promise<Video> {
  const video = await videoRepository.findById(id);
  if (!video || video.deletedAt) throw new ApiError('VIDEO_NOT_FOUND');
  return video;
}

async function recordView(videoId: string, userId: string): Promise<void> {
  const since = new Date(Date.now() - VIEW_DEDUPE_WINDOW_MS);
  const recent = await viewEventRepository.findRecentByVideoAndUser(videoId, userId, since);
  if (recent) return;
  await viewEventRepository.create({ videoId, userId });
  await videoRepository.incrementViewCount(videoId);
}

export async function listVideos(page: number, limit: number, sort: VideoSort, search?: string) {
  const { items, total } = await videoRepository.list(page, limit, sort, search);
  return { items: items.map(toPublicVideo), total };
}

export async function getVideoDetail(id: string, viewerId: string) {
  await getExistingVideo(id);
  await recordView(id, viewerId);

  const [fresh, reaction] = await Promise.all([
    videoRepository.findById(id),
    reactionRepository.findByVideoAndUser(id, viewerId),
  ]);

  return { ...toPublicVideo(fresh as Video), myReaction: reaction?.type ?? null };
}

export async function getRecommended(id: string, limit: number) {
  const video = await getExistingVideo(id);

  const sameCategory = await videoRepository.findRecommendedByCategory(video.category, id, limit);
  if (sameCategory.length >= limit) {
    return sameCategory.map(toPublicVideo);
  }

  const excludeIds = [id, ...sameCategory.map((v) => v.id)];
  const backfill = await videoRepository.findMostViewed(excludeIds, limit - sameCategory.length);
  return [...sameCategory, ...backfill].map(toPublicVideo);
}

export async function getMyVideos(ownerId: string, page: number, limit: number) {
  const { items, total } = await videoRepository.listByOwner(ownerId, page, limit);
  return { items: items.map(toPublicVideo), total };
}

export async function createVideo(
  ownerId: string,
  data: { title: string; description: string; category: VideoCategory; videoKey: string; thumbnailKey: string }
) {
  const video = await videoRepository.create({ ...data, ownerId });
  return toPublicVideo(await getExistingVideo(video.id));
}

export async function updateVideo(
  id: string,
  ownerId: string,
  data: Partial<{ title: string; description: string; category: VideoCategory; thumbnailKey: string }>
) {
  const video = await getExistingVideo(id);
  if (video.ownerId !== ownerId) throw new ApiError('AUTH_FORBIDDEN');

  await videoRepository.update(id, data);
  return toPublicVideo(await getExistingVideo(id));
}

export async function deleteVideo(id: string, requester: { id: string; role: string }): Promise<void> {
  const video = await getExistingVideo(id);
  if (video.ownerId !== requester.id && requester.role !== 'ADMIN') throw new ApiError('AUTH_FORBIDDEN');
  await videoRepository.softDelete(id);
}
