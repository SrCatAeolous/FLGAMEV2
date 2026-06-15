import { Server, Socket } from 'socket.io';

interface Room {
  id: string;
  host: string;
  hostSocket: string;
  guest: string | null;
  guestSocket: string | null;
  hostReady: boolean;
  guestReady: boolean;
  hostTeam: string[];
  guestTeam: string[];
}

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('create-room', (data: { username: string }, callback: (resp: { roomId: string } | { error: string }) => void) => {
      const roomId = generateRoomCode();
      const room: Room = {
        id: roomId,
        host: data.username,
        hostSocket: socket.id,
        guest: null,
        guestSocket: null,
        hostReady: false,
        guestReady: false,
        hostTeam: [],
        guestTeam: [],
      };
      rooms.set(roomId, room);
      socket.join(roomId);
      callback({ roomId });
    });

    socket.on('join-room', (data: { roomId: string; username: string }, callback: (resp: { success: boolean; host?: string; error?: string }) => void) => {
      const room = rooms.get(data.roomId.toUpperCase());
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }
      if (room.guest) {
        callback({ success: false, error: 'Room is full' });
        return;
      }

      room.guest = data.username;
      room.guestSocket = socket.id;
      socket.join(room.id);

      callback({ success: true, host: room.host });
      io.to(room.hostSocket).emit('guest-joined', { username: data.username });
    });

    socket.on('select-team', (data: { roomId: string; team: string[] }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;

      if (socket.id === room.hostSocket) {
        room.hostTeam = data.team;
        room.hostReady = true;
      } else if (socket.id === room.guestSocket) {
        room.guestTeam = data.team;
        room.guestReady = true;
      }

      if (room.hostReady && room.guestReady) {
        io.to(room.id).emit('match-start', {
          hostTeam: room.hostTeam,
          guestTeam: room.guestTeam,
          host: room.host,
          guest: room.guest,
        });
      }
    });

    socket.on('game-state', (data: { roomId: string; state: unknown }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;
      socket.to(room.id).emit('game-state', data.state);
    });

    socket.on('game-input', (data: { roomId: string; input: unknown }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;
      socket.to(room.id).emit('game-input', {
        playerId: socket.id === room.hostSocket ? 'host' : 'guest',
        input: data.input,
      });
    });

    socket.on('disconnect', () => {
      for (const [roomId, room] of rooms.entries()) {
        if (socket.id === room.hostSocket || socket.id === room.guestSocket) {
          io.to(roomId).emit('player-disconnected');
          rooms.delete(roomId);
          break;
        }
      }
    });
  });
}
