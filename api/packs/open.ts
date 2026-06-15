import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../_lib/db.js';
import { User } from '../_lib/User.js';
import { verifyToken } from '../_lib/auth.js';

interface PackType {
  id: string;
  cost: number;
  cardCount: number;
  weights: { tier: string; weight: number }[];
}

const PACK_TYPES: PackType[] = [
  {
    id: 'bronze',
    cost: 500,
    cardCount: 3,
    weights: [
      { tier: 'bronze', weight: 75 },
      { tier: 'silver', weight: 20 },
      { tier: 'gold', weight: 5 },
    ],
  },
  {
    id: 'silver',
    cost: 2000,
    cardCount: 3,
    weights: [
      { tier: 'silver', weight: 60 },
      { tier: 'gold', weight: 30 },
      { tier: 'icon', weight: 10 },
    ],
  },
  {
    id: 'gold',
    cost: 5000,
    cardCount: 3,
    weights: [
      { tier: 'gold', weight: 55 },
      { tier: 'icon', weight: 35 },
      { tier: 'prime', weight: 10 },
    ],
  },
  {
    id: 'icon',
    cost: 15000,
    cardCount: 3,
    weights: [
      { tier: 'icon', weight: 50 },
      { tier: 'prime', weight: 50 },
    ],
  },
];

const PLAYERS_BY_TIER: Record<string, string[]> = {
  bronze: ['chilavert', 'higuita', 'kluivert', 'seedorf', 'trezeguet', 'nakata', 'okocha', 'vieri'],
  silver: ['valderrama', 'stoichkov', 'batistuta', 'rivaldo', 'gerrard', 'lampard', 'drogba', 'scholes'],
  gold: ['pirlo', 'henry', 'xavi', 'iniesta', 'ibrahimovic', 'neymar', 'roberto_carlos', 'cafu'],
  icon: ['yashin', 'beckenbauer', 'maldini', 'cruyff', 'zidane', 'ronaldinho', 'buffon', 'eusebio'],
  prime: ['messi', 'cristiano', 'maradona', 'pele', 'ronaldo9'],
};

function pickTier(weights: { tier: string; weight: number }[]): string {
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let rand = Math.random() * total;
  for (const w of weights) {
    rand -= w.weight;
    if (rand <= 0) return w.tier;
  }
  return weights[weights.length - 1].tier;
}

function pickPlayer(tier: string): string {
  const pool = PLAYERS_BY_TIER[tier] || PLAYERS_BY_TIER.bronze;
  return pool[Math.floor(Math.random() * pool.length)];
}

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

    const { packId } = req.body;
    const pack = PACK_TYPES.find((p) => p.id === packId);
    if (!pack) {
      return res.status(400).json({ error: 'Invalid pack type' });
    }

    const user = await User.findById(auth.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.coins < pack.cost) {
      return res.status(400).json({ error: 'Not enough coins' });
    }

    const newCards: { legendId: string; tier: string }[] = [];
    for (let i = 0; i < pack.cardCount; i++) {
      const tier = pickTier(pack.weights);
      const legendId = pickPlayer(tier);
      newCards.push({ legendId, tier });
    }

    user.coins -= pack.cost;
    for (const card of newCards) {
      user.cards.push({ legendId: card.legendId, obtainedAt: new Date() });
    }
    await user.save();

    return res.json({
      cards: newCards,
      remainingCoins: user.coins,
    });
  } catch (err) {
    console.error('Pack open error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
