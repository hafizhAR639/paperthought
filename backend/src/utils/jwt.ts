import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { JwtPayload, DecodedToken } from '../types/index.js';

export function generateToken(payload: JwtPayload, expiresIn: SignOptions['expiresIn'] = '7d'): string {
  const signOptions: SignOptions = { expiresIn };
  return jwt.sign(payload, config.jwtSecret, signOptions);
}

export function verifyToken(token: string): DecodedToken {
  return jwt.verify(token, config.jwtSecret) as DecodedToken;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}
