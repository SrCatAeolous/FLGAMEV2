import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { connectDB } from './db';
import authRoutes from './routes/auth';
import packRoutes from './routes/packs';
import userRoutes from './routes/user';
import { setupSocketHandlers } from './socket/match';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/packs', packRoutes);
app.use('/api/user', userRoutes);

setupSocketHandlers(io);

const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  try {
    if (process.env.MONGODB_URI) {
      await connectDB();
      console.log('Connected to MongoDB');
    } else {
      console.warn('MONGODB_URI not set - running without database (auth/packs disabled)');
    }

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
