import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { userService } from '../services/userService';

export const userController = {
  syncProfile: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Yetkilendirilmemiş istek' });
        return;
      }
      
      const { name, email } = req.body;
      const updatedUser = await userService.syncProfile(user.author_token, name, email || null);
      res.json(updatedUser);
    } catch (error: any) {
      console.error('Error syncing profile:', error);
      res.status(error.status || 500).json({ error: error.message || 'Profil senkronizasyonu sırasında hata oluştu' });
    }
  }
};
