import { userRepository } from '../repositories/user.repository';
import { videoRepository } from '../repositories/video.repository';
import { viewEventRepository } from '../repositories/view-event.repository';
import { hashPassword } from '../utils/password.util';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '../entities/User.entity';

export async function createUser(data: { email: string; password: string; name: string; role: UserRole }) {
  const existing = await userRepository.findByEmail(data.email);
  if (existing) throw new ApiError('DUPLICATE_EMAIL');

  const passwordHash = await hashPassword(data.password);
  const user = await userRepository.create({
    email: data.email,
    passwordHash,
    name: data.name,
    role: data.role,
    channelName: data.name,
  });

  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export async function getVideoAnalytics(videoId: string) {
  const video = await videoRepository.findById(videoId);
  if (!video || video.deletedAt) throw new ApiError('VIDEO_NOT_FOUND');

  const uniqueViewers = await viewEventRepository.countDistinctViewersByVideo(videoId);

  return {
    videoId: video.id,
    title: video.title,
    totalViews: video.viewCount,
    uniqueViewers,
    likeCount: video.likeCount,
    dislikeCount: video.dislikeCount,
    commentCount: video.commentCount,
  };
}

export async function getViewsByDay(videoId: string, from: Date, to: Date) {
  const video = await videoRepository.findById(videoId);
  if (!video || video.deletedAt) throw new ApiError('VIDEO_NOT_FOUND');
  return viewEventRepository.viewsByDay(videoId, from, to);
}

export async function getDashboard() {
  const [totalUsers, totalVideos, totalViews] = await Promise.all([
    userRepository.countAll(),
    videoRepository.countAll(),
    videoRepository.sumViewCount(),
  ]);
  return { totalUsers, totalVideos, totalViews };
}
