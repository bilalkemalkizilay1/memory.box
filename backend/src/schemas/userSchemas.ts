import { z } from 'zod';

export const syncUserSchema = z.object({
  name: z.string().min(1, 'İsim boş olamaz').max(100),
  email: z.string().email('Geçersiz e-posta adresi').or(z.literal('')).nullable().optional()
});
