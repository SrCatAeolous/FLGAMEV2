import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../_lib/db.js';
import { User } from '../_lib/User.js';
import { verifyToken } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyToken(req);
  if (!auth) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    await connectDB();

    const user = await User.findById(auth.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user._id,
      username: user.username,
      coins: user.coins,
      level: user.level,
      xp: user.xp,
      cards: user.cards,
      stats: user.stats,
    });
  } catch (err) {
    console.error('Profile error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
