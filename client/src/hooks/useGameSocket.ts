import { useEffect } from 'react';
import { socketService } from '../services/socket';
import { useGameStore } from '../store/gameStore';
import { GameSettings } from '@shared/types';

export function useGameSocket() {
  const { 
    setRoom, 
    setCurrentPlayerId, 
    setError,
    setInLobby,
    setPlaying,
    room 
  } = useGameStore();

  useEffect(() => {
    const socket = socketService.connect();

    // Store socket ID as player ID
    if (socket.id) {
      setCurrentPlayerId(socket.id);
    }

    socket.on('connect', () => {
      setCurrentPlayerId(socket.id!);
    });

    // Room created (host)
    socket.on('room-created', ({ instanceId, room: newRoom }) => {
      console.log('Room created:', instanceId);
      setRoom(newRoom);
      setInLobby(true);
    });

    // Player joined
    socket.on('player-joined', ({ room: updatedRoom }) => {
      console.log('Player joined');
      setRoom(updatedRoom);
    });

    // Player left
    socket.on('player-left', ({ room: updatedRoom }) => {
      console.log('Player left');
      setRoom(updatedRoom);
    });

    // Settings updated
    socket.on('settings-updated', ({ room: updatedRoom }) => {
      console.log('Settings updated');
      setRoom(updatedRoom);
    });

    // Player ready status changed
    socket.on('player-ready-changed', ({ room: updatedRoom }) => {
      console.log('Player ready status changed');
      setRoom(updatedRoom);
    });

    // Player AFK status changed
    socket.on('player-afk-changed', ({ room: updatedRoom }) => {
      console.log('Player AFK status changed');
      setRoom(updatedRoom);
    });

    // Game started
    socket.on('game-started', ({ room: updatedRoom }) => {
      console.log('Game started!');
      setRoom(updatedRoom);
      setInLobby(false);
      setPlaying(true);
    });

    // Errors
    socket.on('error', ({ message }) => {
      console.error('Server error:', message);
      setError(message);
    });

    return () => {
      // Don't disconnect on unmount, keep connection alive
    };
  }, [setRoom, setCurrentPlayerId, setError, setInLobby, setPlaying]);

  // Game actions
  const createRoom = (playerName: string, instanceId: string) => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('create-room', { playerName, instanceId });
    }
  };

  const joinRoom = (instanceId: string, playerName: string) => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('join-room', { instanceId, playerName });
    }
  };

  const updateSettings = (settings: Partial<GameSettings>) => {
    const socket = socketService.getSocket();
    if (socket && room) {
      socket.emit('update-settings', { instanceId: room.id, settings });
    }
  };

  const toggleReady = () => {
    const socket = socketService.getSocket();
    if (socket && room) {
      socket.emit('toggle-ready', { instanceId: room.id });
    }
  };

  const toggleAFK = () => {
    const socket = socketService.getSocket();
    if (socket && room) {
      socket.emit('toggle-afk', { instanceId: room.id });
    }
  };

  const startGame = (allowSolo?: boolean) => {
    const socket = socketService.getSocket();
    if (socket && room) {
      socket.emit('start-game', { instanceId: room.id, allowSolo });
    }
  };

  const leaveRoom = () => {
    const socket = socketService.getSocket();
    if (socket && room) {
      socket.emit('leave-room', { instanceId: room.id });
      setInLobby(false);
      setPlaying(false);
      setRoom(null);
    }
  };

  return {
    createRoom,
    joinRoom,
    updateSettings,
    toggleReady,
    toggleAFK,
    startGame,
    leaveRoom,
    isConnected: socketService.isConnected()
  };
}