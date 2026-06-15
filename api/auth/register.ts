import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { connectDB } from '../_lib/db';
import { User } from '../_lib/User';
import { signToken } from '../_lib/auth';

const STARTER_CARDS = [
  { legendId: 'valderrama' },
  { legendId: 'stoichkov' },
  { legendId: 'kluivert' },
  { legendId: 'seedorf' },
  { legendId: 'gerrard' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.toLowerCase(),
      password: hash,
      coins: 5000,
      cards: STARTER_CARDS.map((c) => ({ ...c, obtainedAt: new Date() })),
    });

    const token = signToken(user._id.toString(), user.username);
    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        coins: user.coins,
        level: user.level,
        xp: user.xp,
        cards: user.cards,
        stats: user.stats,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
