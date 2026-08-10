import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { loginSchema, refreshSchema, logoutSchema } from '../validations/auth.validation';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(logoutSchema), authController.logout);

export default router;
