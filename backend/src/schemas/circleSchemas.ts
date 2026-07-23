import { z } from 'zod';

export const createCircleSchema = z.object({
  name: z.string().min(1, 'Çember adı boş olamaz').max(100)
});
