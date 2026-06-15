import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { signToken } from '../middleware/auth';

const router = Router();

const STARTER_CARDS = [
  { legendId: 'valderrama' },
  { legendId: 'stoichkov' },
  { legendId: 'kluivert' },
  { legendId: 'seedorf' },
  { legendId: 'gerrard' },
];

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }
    if (username.length < 3 || username.length > 20) {
      res.status(400).json({ error: 'Username must be 3-20 characters' });
      return;
    }
    if (password.length < 4) {
      res.status(400).json({ error: 'Password must be at least 4 characters' });
      return;
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.toLowerCase(),
      password: hash,
      coins: 5000,
      cards: STARTER_CARDS.map((c) => ({ ...c, obtainedAt: new Date() })),
    });

    const token = signToken(user._id.toString(), user.username);
    res.json({
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
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken(user._id.toString(), user.username);
    res.json({
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
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
