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
