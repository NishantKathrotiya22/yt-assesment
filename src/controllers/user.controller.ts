import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import * as userService from '../services/user.service';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getMe(req.user!.id);
  sendSuccess(res, user);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateMe(req.user!.id, req.body);
  sendSuccess(res, user);
});

export const getPublicProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await userService.getPublicProfile(req.params.id);
  sendSuccess(res, profile);
});
