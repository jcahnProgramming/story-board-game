#!/bin/bash

echo "Setting up server..."

# Server package.json
cat > server/package.json << 'SERVERPKG'
{
  "name": "server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.6",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  }
}
SERVERPKG

# Server tsconfig.json
cat > server/tsconfig.json << 'SERVERTS'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
SERVERTS

# src/index.ts
cat > server/src/index.ts << 'INDEXTS'
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initializeSocketHandlers } from './sockets/index.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize socket handlers
initializeSocketHandlers(io);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🎮 Socket.io ready for connections`);
});
INDEXTS

# src/sockets/index.ts
cat > server/src/sockets/index.ts << 'SOCKETSINDEX'
import { Server, Socket } from 'socket.io';
import { GameRoom } from '../services/RoomManager.js';

const rooms = new Map<string, GameRoom>();

export function initializeSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Player connected: ${socket.id}`);

    socket.on('create-room', (data: { playerName: string }) => {
      const roomId = generateRoomId();
      const room: GameRoom = {
        id: roomId,
        host: socket.id,
        players: [{
          id: socket.id,
          name: data.playerName,
          isHost: true,
          isReady: false
        }],
        settings: {
          boardLength: 20,
          turnTimer: 60,
          votingEnabled: true
        },
        status: 'waiting'
      };
      
      rooms.set(roomId, room);
      socket.join(roomId);
      socket.emit('room-created', { roomId, room });
      console.log(`🏠 Room created: ${roomId}`);
    });

    socket.on('join-room', (data: { roomId: string; playerName: string }) => {
      const room = rooms.get(data.roomId);
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.status !== 'waiting') {
        socket.emit('error', { message: 'Game already in progress' });
        return;
      }

      const player = {
        id: socket.id,
        name: data.playerName,
        isHost: false,
        isReady: false
      };

      room.players.push(player);
      socket.join(data.roomId);
      io.to(data.roomId).emit('player-joined', { room });
      console.log(`👤 Player ${data.playerName} joined room ${data.roomId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Player disconnected: ${socket.id}`);
      
      // Remove player from any rooms
      rooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          
          if (room.players.length === 0) {
            rooms.delete(roomId);
            console.log(`🗑️  Room ${roomId} deleted (empty)`);
          } else {
            io.to(roomId).emit('player-left', { room });
          }
        }
      });
    });
  });
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
SOCKETSINDEX

# src/services/RoomManager.ts
cat > server/src/services/RoomManager.ts << 'ROOMMANAGER'
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  position?: number;
  role?: string;
}

export interface GameSettings {
  boardLength: number;
  turnTimer: number;
  votingEnabled: boolean;
}

export interface GameRoom {
  id: string;
  host: string;
  players: Player[];
  settings: GameSettings;
  status: 'waiting' | 'playing' | 'finished';
}
ROOMMANAGER

echo "Server setup complete!"
