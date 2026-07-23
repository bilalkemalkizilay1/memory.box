import { Router } from 'express';
import { circleController } from '../controllers/circleController';
import { authMiddleware } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createCircleSchema } from '../schemas/circleSchemas';

const router = Router();

router.post('/', authMiddleware, validate(createCircleSchema), circleController.createCircle);
router.get('/my', authMiddleware, circleController.listUserCircles);
router.get('/:id', authMiddleware, circleController.joinCircle); // Maintained GET route for backward-compatibility with join validation

export default router;
