import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayerCard {
  legendId: string;
  obtainedAt: Date;
}

export interface IUserStats {
  wins: number;
  losses: number;
  draws: number;
  goalsScored: number;
  goalsConceded: number;
  matchesPlayed: number;
}

export interface IUser extends Document {
  username: string;
  password: string;
  coins: number;
  level: number;
  xp: number;
  cards: IPlayerCard[];
  stats: IUserStats;
  createdAt: Date;
}

const PlayerCardSchema = new Schema<IPlayerCard>({
  legendId: { type: String, required: true },
  obtainedAt: { type: Date, default: Date.now },
});

const UserStatsSchema = new Schema<IUserStats>({
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  goalsScored: { type: Number, default: 0 },
  goalsConceded: { type: Number, default: 0 },
  matchesPlayed: { type: Number, default: 0 },
});

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, minlength: 3, maxlength: 20 },
  password: { type: String, required: true },
  coins: { type: Number, default: 5000 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  cards: { type: [PlayerCardSchema], default: [] },
  stats: { type: UserStatsSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
