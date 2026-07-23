import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { syncUserSchema } from '../schemas/userSchemas';

const router = Router();

router.post('/sync', authMiddleware, validate(syncUserSchema), userController.syncProfile);

export default router;
