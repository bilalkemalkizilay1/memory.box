import { Router } from 'express';
import { memoryController } from '../controllers/memoryController';
import { authMiddleware } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createMemorySchema, updateMemorySchema, reactionSchema } from '../schemas/memorySchemas';

const router = Router();

router.post('/', authMiddleware, validate(createMemorySchema), memoryController.createMemory);
router.get('/', authMiddleware, memoryController.listMemories);
router.put('/:id', authMiddleware, validate(updateMemorySchema), memoryController.updateMemory);
router.delete('/:id', authMiddleware, memoryController.deleteMemory);
router.post('/:id/reactions', authMiddleware, validate(reactionSchema), memoryController.toggleReaction);

export default router;
