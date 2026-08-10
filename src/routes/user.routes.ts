import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { updateMeSchema, userIdParamSchema } from '../validations/user.validation';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateMeSchema), userController.updateMe);
router.get('/:id', validate(userIdParamSchema, 'params'), userController.getPublicProfile);

export default router;
