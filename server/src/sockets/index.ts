import { Server, Socket } from 'socket.io';
import type { GameRoom, Player, GameSettings } from '@shared/types';

const rooms = new Map<string, GameRoom>();

export function initializeSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Player connected: ${socket.id}`);

    // Create room (host)
    socket.on('create-room', (data: { playerName: string; instanceId: string; discordUser?: any }) => {
      const { playerName, instanceId, discordUser } = data;
      
      // Check if room already exists for this instance
      let room = rooms.get(instanceId);
      
      if (!room) {
        // Create new room
        room = {
          id: instanceId,
          host: socket.id,
          players: [{
            id: socket.id,
            name: playerName,
            isHost: true,
            isReady: true,
            isAFK: false,
            position: 0,
            score: 0,
            discordId: discordUser?.id,
            discordAvatar: discordUser?.avatar,
            discordDiscriminator: discordUser?.discriminator
          }],
          settings: {
            boardLength: 20,
            turnTimer: 60,
            maxPlayers: 8,
            votingEnabled: true,
            selectedStoryPack: 'family-friendly',
            maxBranchPaths: 3,
            branchSelectionMode: 'player-choice',
            randomizationLevel: 'medium'
          },
          status: 'waiting',
          story: []
        };
        
        rooms.set(instanceId, room);
        socket.join(instanceId);
        socket.emit('room-created', { instanceId, room });
        console.log(`🏠 Room created: ${instanceId} by ${playerName}`);
      } else {
        // Room exists, join it instead
        const player: Player = {
          id: socket.id,
          name: playerName,
          isHost: false,
          isReady: false,
          isAFK: false,
          position: 0,
          score: 0,
          discordId: discordUser?.id,
          discordAvatar: discordUser?.avatar,
          discordDiscriminator: discordUser?.discriminator
        };
        
        room.players.push(player);
        socket.join(instanceId);
        io.to(instanceId).emit('player-joined', { room });
        console.log(`👤 Player ${playerName} joined existing room ${instanceId}`);
      }
    });

    // Join room (player)
    socket.on('join-room', (data: { instanceId: string; playerName: string; discordUser?: any }) => {
      const { instanceId, playerName, discordUser } = data;
      const room = rooms.get(instanceId);
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.status !== 'waiting') {
        socket.emit('error', { message: 'Game already in progress' });
        return;
      }

      if (room.players.length >= room.settings.maxPlayers) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      const player: Player = {
        id: socket.id,
        name: playerName,
        isHost: false,
        isReady: false,
        isAFK: false,
        position: 0,
        score: 0,
        discordId: discordUser?.id,
        discordAvatar: discordUser?.avatar,
        discordDiscriminator: discordUser?.discriminator
      };

      room.players.push(player);
      socket.join(instanceId);
      io.to(instanceId).emit('player-joined', { room });
      console.log(`👤 Player ${playerName} joined room ${instanceId}`);
    });

    // Update settings (host only)
    socket.on('update-settings', (data: { instanceId: string; settings: Partial<GameSettings> }) => {
      const { instanceId, settings } = data;
      const room = rooms.get(instanceId);
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.host !== socket.id) {
        socket.emit('error', { message: 'Only host can update settings' });
        return;
      }

      room.settings = { ...room.settings, ...settings };
      io.to(instanceId).emit('settings-updated', { room });
      console.log(`⚙️  Settings updated in room ${instanceId}`);
    });

    // Toggle ready
    socket.on('toggle-ready', (data: { instanceId: string }) => {
      const { instanceId } = data;
      const room = rooms.get(instanceId);
      
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (player && !player.isHost) {
        player.isReady = !player.isReady;
        io.to(instanceId).emit('player-ready-changed', { room });
        console.log(`✓ Player ${player.name} is ${player.isReady ? 'ready' : 'not ready'}`);
      }
    });

    // Toggle AFK
    socket.on('toggle-afk', (data: { instanceId: string }) => {
      const { instanceId } = data;
      const room = rooms.get(instanceId);
      
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.isAFK = !player.isAFK;
        if (player.isAFK) {
          player.isReady = false; // AFK players can't be ready
        }
        io.to(instanceId).emit('player-afk-changed', { room });
        console.log(`💤 Player ${player.name} is ${player.isAFK ? 'AFK' : 'back'}`);
      }
    });

    // Start game (host only)
    socket.on('start-game', (data: { instanceId: string; allowSolo?: boolean }) => {
      const { instanceId, allowSolo } = data;
      const room = rooms.get(instanceId);
      
      if (!room || room.host !== socket.id) return;

      const activePlayers = room.players.filter(p => !p.isAFK);
      
      // Check player count
      if (activePlayers.length < 3 && !allowSolo) {
        socket.emit('error', { message: 'Need at least 3 active players or enable solo play' });
        return;
      }

      // If solo play, disable voting
      if (activePlayers.length === 1) {
        room.settings.votingEnabled = false;
      }

      room.status = 'playing';
      io.to(instanceId).emit('game-started', { room, roles: new Map() });
      console.log(`🎮 Game started in room ${instanceId} (${activePlayers.length} players, solo: ${activePlayers.length === 1})`);
    });

    // Roll dice
    socket.on('roll-dice', (data: { instanceId: string }) => {
      const { instanceId } = data;
      const room = rooms.get(instanceId);
      
      if (!room || room.status !== 'playing') return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      // TODO: Check if it's player's turn (for now, anyone can roll)
      
      // Roll dice (1-6)
      const roll = Math.floor(Math.random() * 6) + 1;
      
      // Simply add the roll to current position
      // The client will handle the actual board layout
      const newPosition = player.position + roll;
      player.position = newPosition;

      // Emit dice roll result
      io.to(instanceId).emit('dice-rolled', { playerId: player.id, roll, room });
      
      // Emit player moved
      io.to(instanceId).emit('player-moved', { playerId: player.id, newPosition, room });
      
      console.log(`🎲 ${player.name} rolled ${roll}, moved from ${player.position - roll} to position ${newPosition}`);
    });

    // Leave room
    socket.on('leave-room', (data: { instanceId: string }) => {
      handlePlayerLeave(socket, data.instanceId);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Player disconnected: ${socket.id}`);
      
      // Remove player from any rooms
      rooms.forEach((room, instanceId) => {
        handlePlayerLeave(socket, instanceId);
      });
    });
  });

  function handlePlayerLeave(socket: Socket, instanceId: string) {
    const room = rooms.get(instanceId);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1) return;

    const player = room.players[playerIndex];
    room.players.splice(playerIndex, 1);

    // If host left, assign new host
    if (player.isHost && room.players.length > 0) {
      room.players[0].isHost = true;
      room.players[0].isReady = true;
      room.host = room.players[0].id;
      console.log(`👑 New host: ${room.players[0].name}`);
    }

    if (room.players.length === 0) {
      rooms.delete(instanceId);
      console.log(`🗑️  Room ${instanceId} deleted (empty)`);
    } else {
      io.to(instanceId).emit('player-left', { room });
      console.log(`👋 Player ${player.name} left room ${instanceId}`);
    }

    socket.leave(instanceId);
  }
}