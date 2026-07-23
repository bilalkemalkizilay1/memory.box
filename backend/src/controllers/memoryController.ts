import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { memoryService } from '../services/memoryService';

export const memoryController = {
  createMemory: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Yetkilendirilmemiş istek' });
        return;
      }

      const memory = await memoryService.createMemory(user.id, req.body);
      res.status(201).json(memory);
    } catch (error: any) {
      console.error('Error creating memory:', error);
      res.status(error.status || 500).json({ error: error.message || 'Anı oluşturulurken hata oluştu' });
    }
  },

  listMemories: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Yetkilendirilmemiş istek' });
        return;
      }

      const circleIdsQuery = req.query.circle_ids as string;
      const circleIds = circleIdsQuery ? circleIdsQuery.split(',') : [];

      const memories = await memoryService.listMemories(user.id, circleIds);
      res.json(memories);
    } catch (error: any) {
      console.error('Error listing memories:', error);
      res.status(500).json({ error: 'Anılar listelenirken hata oluştu' });
    }
  },

  updateMemory: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Yetkilendirilmemiş istek' });
        return;
      }

      const { id } = req.params;
      const updated = await memoryService.updateMemory(id, user.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating memory:', error);
      res.status(error.status || 500).json({ error: error.message || 'Anı güncellenirken hata oluştu' });
    }
  },

  deleteMemory: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Yetkilendirilmemiş istek' });
        return;
      }

      const { id } = req.params;
      await memoryService.deleteMemory(id, user.id);
      res.json({ success: true, message: 'Anı silindi (soft-deleted)' });
    } catch (error: any) {
      console.error('Error deleting memory:', error);
      res.status(error.status || 500).json({ error: error.message || 'Anı silinirken hata oluştu' });
    }
  },

  toggleReaction: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Yetkilendirilmemiş istek' });
        return;
      }

      const { id } = req.params;
      const { type } = req.body;

      const result = await memoryService.toggleReaction(id, user.id, type);
      res.json(result);
    } catch (error: any) {
      console.error('Error toggling reaction:', error);
      res.status(error.status || 500).json({ error: error.message || 'Reaksiyon güncellenirken hata oluştu' });
    }
  }
};
