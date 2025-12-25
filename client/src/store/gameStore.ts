import { create } from 'zustand';
import { GameRoom, Player, GameSettings } from '@shared/types';

interface GameState {
  // Room state
  room: GameRoom | null;
  currentPlayerId: string | null;
  
  // UI state
  isInLobby: boolean;
  isPlaying: boolean;
  error: string | null;
  
  // Actions
  setRoom: (room: GameRoom | null) => void;
  setCurrentPlayerId: (id: string) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setInLobby: (inLobby: boolean) => void;
  setPlaying: (playing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  room: null,
  currentPlayerId: null,
  isInLobby: false,
  isPlaying: false,
  error: null,

  // Actions
  setRoom: (room) => set({ room }),
  
  setCurrentPlayerId: (id) => set({ currentPlayerId: id }),
  
  updateSettings: (settings) => set((state) => {
    if (!state.room) return state;
    return {
      room: {
        ...state.room,
        settings: {
          ...state.room.settings,
          ...settings
        }
      }
    };
  }),
  
  updatePlayer: (playerId, updates) => set((state) => {
    if (!state.room) return state;
    return {
      room: {
        ...state.room,
        players: state.room.players.map(p => 
          p.id === playerId ? { ...p, ...updates } : p
        )
      }
    };
  }),
  
  addPlayer: (player) => set((state) => {
    if (!state.room) return state;
    return {
      room: {
        ...state.room,
        players: [...state.room.players, player]
      }
    };
  }),
  
  removePlayer: (playerId) => set((state) => {
    if (!state.room) return state;
    return {
      room: {
        ...state.room,
        players: state.room.players.filter(p => p.id !== playerId)
      }
    };
  }),
  
  setInLobby: (inLobby) => set({ isInLobby: inLobby }),
  
  setPlaying: (playing) => set({ isPlaying: playing }),
  
  setError: (error) => set({ error }),
  
  reset: () => set({
    room: null,
    currentPlayerId: null,
    isInLobby: false,
    isPlaying: false,
    error: null
  })
}));