import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { User } from '../types';

export interface AuthRequest extends Request {
  user?: User;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Bypass auth check for preflight CORS OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    const token = req.headers['x-author-token'] as string;
    
    // Debug logging to verify token transmission
    console.log(`[Auth] Request Path: ${req.path}, Method: ${req.method}, Token Present: ${!!token}`);

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
