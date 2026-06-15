import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose, { Document, Schema } from 'mongoose';
import jwt from 'jsonwebtoken';

/* ---- DB ---- */
let cached = (global as Record<string, unknown>).__mc as { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
if (!cached) { cached = { conn: null, promise: null }; (global as Record<string, unknown>).__mc = cached; }
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  if (cached!.conn) return cached!.conn;
  if (!cached!.promise) cached!.promise = mongoose.connect(uri, { dbName: 'flgame' });
  cached!.conn = await cached!.promise;
  return cached!.conn;
}

/* ---- User Model ---- */
interface IUser extends Document { username: string; password: string; coins: number; level: number; xp: number; cards: { legendId: string; obtainedAt: Date }[]; stats: { wins: number; losses: number; draws: number; goalsScored: number; goalsConceded: number; matchesPlayed: number }; }
const CardSchema = new Schema({ legendId: { type: String, required: true }, obtainedAt: { type: Date, default: Date.now } });
const StatsSchema = new Schema({ wins: { type: Number, default: 0 }, losses: { type: Number, default: 0 }, draws: { type: Number, default: 0 }, goalsScored: { type: Number, default: 0 }, goalsConceded: { type: Number, default: 0 }, matchesPlayed: { type: Number, default: 0 } });
const UserSchema = new Schema<IUser>({ username: { type: String, required: true, unique: true, minlength: 3, maxlength: 20 }, password: { type: String, required: true }, coins: { type: Number, default: 5000 }, level: { type: Number, default: 1 }, xp: { type: Number, default: 0 }, cards: { type: [CardSchema], default: [] }, stats: { type: StatsSchema, default: () => ({}) }, createdAt: { type: Date, default: Date.now } });
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

/* ---- Auth ---- */
const JWT_SECRET = process.env.JWT_SECRET || 'futlegends-dev-secret';
function verifyToken(req: VercelRequest) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  try { return jwt.verify(h.slice(7), JWT_SECRET) as { userId: string; username: string }; } catch { return null; }
}

/* ---- Pack Data ---- */
const PACK_TYPES = [
  { id: 'bronze', cost: 500, cardCount: 3, weights: [{ tier: 'bronze', weight: 75 }, { tier: 'silver', weight: 20 }, { tier: 'gold', weight: 5 }] },
  { id: 'silver', cost: 2000, cardCount: 3, weights: [{ tier: 'silver', weight: 60 }, { tier: 'gold', weight: 30 }, { tier: 'icon', weight: 10 }] },
  { id: 'gold', cost: 5000, cardCount: 3, weights: [{ tier: 'gold', weight: 55 }, { tier: 'icon', weight: 35 }, { tier: 'prime', weight: 10 }] },
  { id: 'icon', cost: 15000, cardCount: 3, weights: [{ tier: 'icon', weight: 50 }, { tier: 'prime', weight: 50 }] },
];

const PLAYERS_BY_TIER: Record<string, string[]> = {
  bronze: ['chilavert', 'higuita', 'kluivert', 'seedorf', 'trezeguet', 'nakata', 'okocha', 'vieri'],
  silver: ['valderrama', 'stoichkov', 'batistuta', 'rivaldo', 'gerrard', 'lampard', 'drogba', 'scholes'],
  gold: ['pirlo', 'henry', 'xavi', 'iniesta', 'ibrahimovic', 'neymar', 'roberto_carlos', 'cafu'],
  icon: ['yashin', 'beckenbauer', 'maldini', 'cruyff', 'zidane', 'ronaldinho', 'buffon', 'eusebio'],
  prime: ['messi', 'cristiano', 'maradona', 'pele', 'ronaldo9'],
};

function pickTier(weights: { tier: string; weight: number }[]) {
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let rand = Math.random() * total;
  for (const w of weights) { rand -= w.weight; if (rand <= 0) return w.tier; }
  return weights[weights.length - 1].tier;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = verifyToken(req);
  if (!auth) return res.status(401).json({ error: 'No token provided' });
  try {
    await connectDB();
    const { packId } = req.body;
    const pack = PACK_TYPES.find(p => p.id === packId);
    if (!pack) return res.status(400).json({ error: 'Invalid pack type' });
    const user = await User.findById(auth.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.coins < pack.cost) return res.status(400).json({ error: 'Not enough coins' });

    const newCards: { legendId: string; tier: string }[] = [];
    for (let i = 0; i < pack.cardCount; i++) {
      const tier = pickTier(pack.weights);
      const pool = PLAYERS_BY_TIER[tier] || PLAYERS_BY_TIER.bronze;
      newCards.push({ legendId: pool[Math.floor(Math.random() * pool.length)], tier });
    }

    user.coins -= pack.cost;
    for (const card of newCards) user.cards.push({ legendId: card.legendId, obtainedAt: new Date() });
    await user.save();

    return res.json({ cards: newCards, remainingCoins: user.coins });
  } catch (err) { console.error('Pack open error:', err); return res.status(500).json({ error: 'Server error' }); }
}
