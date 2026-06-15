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

const XP_PER_LEVEL = 500;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = verifyToken(req);
  if (!auth) return res.status(401).json({ error: 'No token provided' });
  try {
    await connectDB();
    const { homeScore, awayScore } = req.body;
    const user = await User.findById(auth.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.stats.matchesPlayed += 1;
    user.stats.goalsScored += homeScore;
    user.stats.goalsConceded += awayScore;

    let coinsEarned = 100 + homeScore * 50;
    let xpEarned = 25;

    if (homeScore > awayScore) { user.stats.wins += 1; coinsEarned += 400; xpEarned += 75; }
    else if (homeScore === awayScore) { user.stats.draws += 1; coinsEarned += 100; xpEarned += 25; }
    else { user.stats.losses += 1; }

    user.coins += coinsEarned;
    user.xp += xpEarned;
    while (user.xp >= XP_PER_LEVEL * user.level) { user.xp -= XP_PER_LEVEL * user.level; user.level += 1; user.coins += 1000; }
    await user.save();

    return res.json({ coinsEarned, xpEarned, totalCoins: user.coins, level: user.level, xp: user.xp, stats: user.stats });
  } catch (err) { console.error('Match result error:', err); return res.status(500).json({ error: 'Server error' }); }
}
