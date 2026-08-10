import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import * as adminService from '../services/admin.service';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.createUser(req.body);
  sendSuccess(res, user, 201);
});

export const getVideoAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await adminService.getVideoAnalytics(req.params.id);
  sendSuccess(res, analytics);
});

export const getViewsByDay = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as unknown as { from?: Date; to?: Date };
  const rangeEnd = to ?? new Date();
  const rangeStart = from ?? new Date(rangeEnd.getTime() - THIRTY_DAYS_MS);
  const data = await adminService.getViewsByDay(req.params.id, rangeStart, rangeEnd);
  sendSuccess(res, data);
});

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const dashboard = await adminService.getDashboard();
  sendSuccess(res, dashboard);
});
