import { z } from 'zod';

export const createMemorySchema = z.object({
  lat: z.number(),
  lng: z.number(),
  content: z.string().min(1, 'Anı içeriği boş olamaz'),
  privacy_mode: z.enum(['public', 'circle', 'private']),
  circle_id: z.string().nullable().optional(),
  memory_date: z.string(), // Accepts any date string; parsed backend-side
  music_provider: z.string().nullable().optional(),
  music_track_id: z.string().nullable().optional(),
  tagged_people: z.array(z.string()).optional().default([]),
  image_url: z.string().nullable().optional()
});

export const updateMemorySchema = z.object({
  content: z.string().min(1, 'Anı içeriği boş olamaz'),
  privacy_mode: z.enum(['public', 'circle', 'private']),
  circle_id: z.string().nullable().optional(),
  memory_date: z.string(),
  music_provider: z.string().nullable().optional(),
  music_track_id: z.string().nullable().optional(),
  tagged_people: z.array(z.string()).optional().default([]),
  image_url: z.string().nullable().optional()
});

export const reactionSchema = z.object({
  type: z.enum(['like', 'hug'])
});
