import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import * as uploadController from '../controllers/upload.controller';
import {
  presignImageSchema,
  initiateVideoUploadSchema,
  uploadSessionIdParamSchema,
  presignPartsSchema,
  completeUploadSchema,
} from '../validations/upload.validation';

const router = Router();

router.use(authenticate);

router.post('/thumbnails/presign', validate(presignImageSchema), uploadController.presignThumbnail);
router.post('/avatars/presign', validate(presignImageSchema), uploadController.presignAvatar);

router.post('/videos/initiate', validate(initiateVideoUploadSchema), uploadController.initiateVideoUpload);
router.post(
  '/videos/:uploadId/parts/presign',
  validate(uploadSessionIdParamSchema, 'params'),
  validate(presignPartsSchema),
  uploadController.presignParts
);
router.get('/videos/:uploadId/parts', validate(uploadSessionIdParamSchema, 'params'), uploadController.listParts);
router.post(
  '/videos/:uploadId/complete',
  validate(uploadSessionIdParamSchema, 'params'),
  validate(completeUploadSchema),
  uploadController.completeUpload
);
router.post('/videos/:uploadId/abort', validate(uploadSessionIdParamSchema, 'params'), uploadController.abortUpload);

export default router;
