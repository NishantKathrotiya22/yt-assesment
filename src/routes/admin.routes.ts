import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { UserRole } from '../entities/User.entity';
import * as adminController from '../controllers/admin.controller';
import { createUserSchema, viewsByDayQuerySchema } from '../validations/admin.validation';
import { videoIdParamSchema } from '../validations/video.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN));

router.post('/users', validate(createUserSchema), adminController.createUser);
router.get('/videos/:id/analytics', validate(videoIdParamSchema, 'params'), adminController.getVideoAnalytics);
router.get(
  '/videos/:id/views-by-day',
  validate(videoIdParamSchema, 'params'),
  validate(viewsByDayQuerySchema, 'query'),
  adminController.getViewsByDay
);
router.get('/dashboard', adminController.getDashboard);

export default router;
