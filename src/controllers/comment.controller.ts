import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { buildMeta } from '../utils/pagination.util';
import * as commentService from '../services/comment.service';

export const listComments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const { items, total } = await commentService.listComments(req.params.id, page, limit);
  sendSuccess(res, items, 200, buildMeta(page, limit, total));
});

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await commentService.createComment(req.params.id, req.user!.id, req.body.text);
  sendSuccess(res, comment, 201);
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  await commentService.deleteComment(req.params.id, req.user!);
  sendSuccess(res, { message: 'Comment deleted.' });
});
