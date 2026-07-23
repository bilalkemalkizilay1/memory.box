import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export const mediaController = {
  uploadFile: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Lütfen yüklenecek bir dosya seçin' });
        return;
      }

      const file = req.file;
      const ext = path.extname(file.originalname);
      const fileName = `${uuidv4()}${ext}`;

      // Upload directly to Supabase Storage bucket 'memory-images'
      const { data, error: uploadError } = await supabase.storage
        .from('memory-images')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase image upload error:', uploadError);
        res.status(500).json({ error: 'Görsel Supabase Storage deposuna yüklenemedi' });
        return;
      }

      // Retrieve public URL of the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('memory-images')
        .getPublicUrl(fileName);

      res.status(201).json({ url: publicUrl });
    } catch (error) {
      console.error('Error handling media upload:', error);
      res.status(500).json({ error: 'Medya yüklenirken sunucu hatası oluştu' });
    }
  }
};
