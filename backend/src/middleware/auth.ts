import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthedRequest extends Request { user?: { id: number; email: string } }

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, env.jwtSecret) as { id: number; email: string };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}
