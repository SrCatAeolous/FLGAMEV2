import { Router, Response } from 'express';
import { User } from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
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
    res.status(500).json({ error: 'Server error' });
  }
});

const XP_PER_LEVEL = 500;

router.post('/match-result', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { homeScore, awayScore } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.stats.matchesPlayed += 1;
    user.stats.goalsScored += homeScore;
    user.stats.goalsConceded += awayScore;

    let coinsEarned = 100 + homeScore * 50;
    let xpEarned = 25;

    if (homeScore > awayScore) {
      user.stats.wins += 1;
      coinsEarned += 400;
      xpEarned += 75;
    } else if (homeScore === awayScore) {
      user.stats.draws += 1;
      coinsEarned += 100;
      xpEarned += 25;
    } else {
      user.stats.losses += 1;
    }

    user.coins += coinsEarned;
    user.xp += xpEarned;

    while (user.xp >= XP_PER_LEVEL * user.level) {
      user.xp -= XP_PER_LEVEL * user.level;
      user.level += 1;
      user.coins += 1000;
    }

    await user.save();

    res.json({
      coinsEarned,
      xpEarned,
      totalCoins: user.coins,
      level: user.level,
      xp: user.xp,
      stats: user.stats,
    });
  } catch (err) {
    console.error('Match result error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
