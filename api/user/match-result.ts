import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../_lib/db';
import { User } from '../_lib/User';
import { verifyToken } from '../_lib/auth';

const XP_PER_LEVEL = 500;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyToken(req);
  if (!auth) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    await connectDB();

    const { homeScore, awayScore } = req.body;
    const user = await User.findById(auth.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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

    return res.json({
      coinsEarned,
      xpEarned,
      totalCoins: user.coins,
      level: user.level,
      xp: user.xp,
      stats: user.stats,
    });
  } catch (err) {
    console.error('Match result error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
