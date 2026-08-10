import { userRepository } from '../repositories/user.repository';
import { videoRepository } from '../repositories/video.repository';
import { ApiError } from '../utils/ApiError';

export async function getMe(userId: string) {
  const user = await userRepository.findById(userId);
  if (!user) throw new ApiError('USER_NOT_FOUND');
  return user;
}

export async function updateMe(userId: string, data: { channelName?: string; avatarKey?: string | null }) {
  await userRepository.update(userId, data);
  return getMe(userId);
}

export async function getPublicProfile(id: string) {
  const user = await userRepository.findById(id);
  if (!user) throw new ApiError('USER_NOT_FOUND');

  const videoCount = await videoRepository.countByOwner(id);

  return {
    id: user.id,
    name: user.name,
    channelName: user.channelName,
    avatarKey: user.avatarKey,
    videoCount,
    createdAt: user.createdAt,
  };
}
