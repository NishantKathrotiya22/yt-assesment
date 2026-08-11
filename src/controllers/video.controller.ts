import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { buildMeta } from '../utils/pagination.util';
import { ReactionType } from '../entities/Reaction.entity';
import { VideoSort } from '../repositories/video.repository';
import * as videoService from '../services/video.service';
import * as reactionService from '../services/reaction.service';

export const listVideos = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, sort, search } = req.query as unknown as {
    page: number;
    limit: number;
    sort: VideoSort;
    search?: string;
  };
  const { items, total } = await videoService.listVideos(page, limit, sort, search);
  sendSuccess(res, items, 200, buildMeta(page, limit, total));
});

export const getMyVideos = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const { items, total } = await videoService.getMyVideos(req.user!.id, page, limit);
  sendSuccess(res, items, 200, buildMeta(page, limit, total));
});

export const getVideo = asyncHandler(async (req: Request, res: Response) => {
  const video = await videoService.getVideoDetail(req.params.id, req.user!.id);
  sendSuccess(res, video);
});

export const getRecommended = asyncHandler(async (req: Request, res: Response) => {
  const { limit } = req.query as unknown as { limit: number };
  const videos = await videoService.getRecommended(req.params.id, limit);
  sendSuccess(res, videos);
});

export const createVideo = asyncHandler(async (req: Request, res: Response) => {
  const video = await videoService.createVideo(req.user!.id, req.body);
  sendSuccess(res, video, 201);
});

export const updateVideo = asyncHandler(async (req: Request, res: Response) => {
  const video = await videoService.updateVideo(req.params.id, req.user!.id, req.body);
  sendSuccess(res, video);
});

export const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
  await videoService.deleteVideo(req.params.id, req.user!);
  sendSuccess(res, { message: 'Video deleted.' });
});

export const setReaction = asyncHandler(async (req: Request, res: Response) => {
  await reactionService.setReaction(req.params.id, req.user!.id, req.body.type as ReactionType);
  sendSuccess(res, { message: 'Reaction saved.' });
});

export const clearReaction = asyncHandler(async (req: Request, res: Response) => {
  await reactionService.clearReaction(req.params.id, req.user!.id);
  sendSuccess(res, { message: 'Reaction removed.' });
});
