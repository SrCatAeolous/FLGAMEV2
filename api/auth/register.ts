import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
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

/* ---- JWT ---- */
const JWT_SECRET = process.env.JWT_SECRET || 'futlegends-dev-secret';
function signToken(userId: string, username: string) { return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' }); }

/* ---- Starter Cards ---- */
const STARTER_CARDS = [{ legendId: 'valderrama' }, { legendId: 'stoichkov' }, { legendId: 'kluivert' }, { legendId: 'seedorf' }, { legendId: 'gerrard' }];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await connectDB();
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    if (username.length < 3 || username.length > 20) return res.status(400).json({ error: 'Username must be 3-20 characters' });
    if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Username already exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username: username.toLowerCase(), password: hash, coins: 5000, cards: STARTER_CARDS.map(c => ({ ...c, obtainedAt: new Date() })) });
    const token = signToken(user._id.toString(), user.username);
    return res.json({ token, user: { id: user._id, username: user.username, coins: user.coins, level: user.level, xp: user.xp, cards: user.cards, stats: user.stats } });
  } catch (err) { console.error('Register error:', err); return res.status(500).json({ error: 'Server error' }); }
}
