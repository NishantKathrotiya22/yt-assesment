import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import * as uploadService from '../services/upload.service';

export const presignThumbnail = asyncHandler(async (req: Request, res: Response) => {
  const { fileName, contentType } = req.body;
  const result = await uploadService.presignThumbnail(fileName, contentType);
  sendSuccess(res, result);
});

export const initiateVideoUpload = asyncHandler(async (req: Request, res: Response) => {
  const { fileName, fileSize, contentType } = req.body;
  const result = await uploadService.initiateVideoUpload(req.user!.id, fileName, fileSize, contentType);
  sendSuccess(res, result, 201);
});

export const presignParts = asyncHandler(async (req: Request, res: Response) => {
  const result = await uploadService.presignParts(req.params.uploadId, req.user!.id, req.body.partNumbers);
  sendSuccess(res, result);
});

export const listParts = asyncHandler(async (req: Request, res: Response) => {
  const result = await uploadService.listUploadedParts(req.params.uploadId, req.user!.id);
  sendSuccess(res, result);
});

export const completeUpload = asyncHandler(async (req: Request, res: Response) => {
  const result = await uploadService.completeUpload(req.params.uploadId, req.user!.id, req.body.parts);
  sendSuccess(res, result);
});

export const abortUpload = asyncHandler(async (req: Request, res: Response) => {
  await uploadService.abortUpload(req.params.uploadId, req.user!.id);
  sendSuccess(res, { message: 'Upload aborted.' });
});
