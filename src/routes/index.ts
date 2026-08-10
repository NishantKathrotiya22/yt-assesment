import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import videoRoutes from './video.routes';
import uploadRoutes from './upload.routes';
import commentRoutes from './comment.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/videos', videoRoutes);
router.use('/uploads', uploadRoutes);
router.use('/comments', commentRoutes);
router.use('/admin', adminRoutes);

export default router;
