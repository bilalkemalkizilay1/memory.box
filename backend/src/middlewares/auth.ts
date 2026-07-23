import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { User } from '../types';

export interface AuthRequest extends Request {
  user?: User;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers['x-author-token'] as string;
    if (!token) {
      res.status(401).json({ error: 'Kimlik doğrulama tokenı (X-Author-Token) eksik' });
      return;
    }
    
    // Retrieve or create user record bound to this token
    const user = await userService.getOrCreateUserByToken(token);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Kimlik doğrulama sırasında sunucu hatası oluştu' });
  }
};
