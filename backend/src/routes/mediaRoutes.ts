import { Router } from 'express';
import { mediaController } from '../controllers/mediaController';
import { upload } from '../middlewares/upload';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Uploading media requires device/user auth signature
router.post('/upload', authMiddleware, upload.single('file'), mediaController.uploadFile);

export default router;
