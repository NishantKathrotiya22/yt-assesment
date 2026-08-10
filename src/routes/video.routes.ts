import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import * as videoController from '../controllers/video.controller';
import * as commentController from '../controllers/comment.controller';
import {
  listVideosQuerySchema,
  videoIdParamSchema,
  recommendedQuerySchema,
  createVideoSchema,
  updateVideoSchema,
  reactionSchema,
} from '../validations/video.validation';
import { listCommentsQuerySchema, createCommentSchema } from '../validations/comment.validation';

const router = Router();

router.use(authenticate);

router.get('/', validate(listVideosQuerySchema, 'query'), videoController.listVideos);
router.get('/mine', validate(listVideosQuerySchema, 'query'), videoController.getMyVideos);
router.post('/', validate(createVideoSchema), videoController.createVideo);

router.get('/:id', validate(videoIdParamSchema, 'params'), videoController.getVideo);
router.patch('/:id', validate(videoIdParamSchema, 'params'), validate(updateVideoSchema), videoController.updateVideo);
router.delete('/:id', validate(videoIdParamSchema, 'params'), videoController.deleteVideo);

router.get(
  '/:id/recommended',
  validate(videoIdParamSchema, 'params'),
  validate(recommendedQuerySchema, 'query'),
  videoController.getRecommended
);

router.post('/:id/reaction', validate(videoIdParamSchema, 'params'), validate(reactionSchema), videoController.setReaction);
router.delete('/:id/reaction', validate(videoIdParamSchema, 'params'), videoController.clearReaction);

router.get(
  '/:id/comments',
  validate(videoIdParamSchema, 'params'),
  validate(listCommentsQuerySchema, 'query'),
  commentController.listComments
);
router.post(
  '/:id/comments',
  validate(videoIdParamSchema, 'params'),
  validate(createCommentSchema),
  commentController.createComment
);

export default router;
