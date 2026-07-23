import { Request, Response } from 'express';
import { musicService } from '../services/musicService';

export const musicController = {
  searchSongs: async (req: Request, res: Response): Promise<void> => {
    try {
      const query = req.query.q as string;
      const songs = await musicService.searchSongs(query);
      res.json(songs);
    } catch (error) {
      console.error('Error searching songs:', error);
      res.status(500).json({ error: 'Şarkı aranırken hata oluştu' });
    }
  },

  getSongDetails: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const track = await musicService.getSongDetails(id);
      res.json(track);
    } catch (error: any) {
      console.error('Error getting song details:', error);
      res.status(error.status || 500).json({ error: error.message || 'Şarkı detayları getirilemedi' });
    }
  }
};
