import jwt from 'jsonwebtoken';
import type { VercelRequest } from '@vercel/node';

const JWT_SECRET = process.env.JWT_SECRET || 'futlegends-dev-secret-change-in-production';

export function signToken(userId: string, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(req: VercelRequest): { userId: string; username: string } | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;

  try {
    const token = header.slice(7);
    return jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
  } catch {
    return null;
  }
}
