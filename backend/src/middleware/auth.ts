import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { DecodedToken } from '../types/index';

declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
      userId?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      req.userId = decoded.userId;
    } catch {
      // Token is invalid, but we don't fail - just continue
    }
  }

  next();
}
