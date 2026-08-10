import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { commentIdParamSchema } from '../validations/comment.validation';
import * as commentController from '../controllers/comment.controller';

const router = Router();

router.use(authenticate);

router.delete('/:id', validate(commentIdParamSchema, 'params'), commentController.deleteComment);

export default router;
