import { z } from 'zod';

export const createMemorySchema = z.object({
  lat: z.number(),
  lng: z.number(),
  content: z.string().min(1, 'Anı içeriği boş olamaz'),
  privacy_mode: z.enum(['public', 'circle', 'private']),
  circle_id: z.string().nullable().optional(),
  memory_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Tarih formatı YYYY-MM-DD olmalıdır'
  }),
  music_provider: z.string().nullable().optional(),
  music_track_id: z.string().nullable().optional(),
  tagged_people: z.array(z.string()).optional().default([]),
  image_url: z.string().url('Geçersiz görsel adresi').nullable().optional()
});

export const updateMemorySchema = z.object({
  content: z.string().min(1, 'Anı içeriği boş olamaz'),
  privacy_mode: z.enum(['public', 'circle', 'private']),
  circle_id: z.string().nullable().optional(),
  memory_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Tarih formatı YYYY-MM-DD olmalıdır'
  }),
  music_provider: z.string().nullable().optional(),
  music_track_id: z.string().nullable().optional(),
  tagged_people: z.array(z.string()).optional().default([])
});

export const reactionSchema = z.object({
  type: z.enum(['like', 'hug'])
});
