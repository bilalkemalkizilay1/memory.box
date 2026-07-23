import { Router } from 'express';
import { musicController } from '../controllers/musicController';

const router = Router();

router.get('/search', musicController.searchSongs);
router.get('/:id', musicController.getSongDetails);

export default router;
