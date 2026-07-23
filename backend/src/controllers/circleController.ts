import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { circleService } from '../services/circleService';

export const circleController = {
  createCircle: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Yetkilendirilmemiş istek' });
        return;
      }

      const { name } = req.body;
      const circle = await circleService.createCircle(name, user.id);
      res.status(201).json(circle);
    } catch (error: any) {
      console.error('Error creating circle:', error);
      res.status(500).json({ error: 'Çember oluşturulurken sunucu hatası oluştu' });
    }
  },

  joinCircle: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Yetkilendirilmemiş istek' });
        return;
      }

      const { id } = req.params; // circle join code
      const circle = await circleService.joinCircle(id, user.id);
      res.json(circle);
    } catch (error: any) {
      console.error('Error joining circle:', error);
      res.status(error.status || 500).json({ error: error.message || 'Çembere katılım hatası' });
    }
  },

  listUserCircles: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Yetkilendirilmemiş istek' });
        return;
      }

      const circles = await circleService.getUserCircles(user.id);
      res.json(circles);
    } catch (error: any) {
      console.error('Error listing user circles:', error);
      res.status(500).json({ error: 'Katılınan çemberler listelenirken sunucu hatası oluştu' });
    }
  }
};
