#!/bin/bash

echo "Setting up shared types..."

# Shared package.json
cat > shared/package.json << 'SHAREDPKG'
{
  "name": "shared",
  "version": "1.0.0",
  "type": "module",
  "main": "./types/index.ts",
  "types": "./types/index.ts",
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
SHAREDPKG

# Shared tsconfig.json
cat > shared/tsconfig.json << 'SHAREDTS'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["types/**/*"]
}
SHAREDTS

# shared/types/index.ts
cat > shared/types/index.ts << 'TYPESINDEX'
// Player Types
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  position: number;
  role?: PlayerRole;
  score: number;
}

export type PlayerRole = 
  | 'comedian'
  | 'dramatist'
  | 'romantic'
  | 'chaos-agent'
  | 'detective'
  | 'poet';

// Game Room Types
export interface GameRoom {
  id: string;
  host: string;
  players: Player[];
  settings: GameSettings;
  status: GameStatus;
  currentTurn?: number;
  story: StoryContribution[];
}

export type GameStatus = 'waiting' | 'playing' | 'voting' | 'finished';

export interface GameSettings {
  boardLength: number;
  turnTimer: number; // seconds, 0 = unlimited
  votingEnabled: boolean;
  maxPlayers: number;
}

// Story Types
export interface StoryContribution {
  playerId: string;
  playerName: string;
  promptType: PromptType;
  prompt: string;
  answer: string;
  position: number;
  votes: number;
  timestamp: number;
}

export type PromptType = 
  | 'character'
  | 'action'
  | 'object'
  | 'location'
  | 'emotion'
  | 'dialogue'
  | 'plot-twist'
  | 'wildcard';

// Board Space Types
export interface BoardSpace {
  position: number;
  type: SpaceType;
  promptType?: PromptType;
}

export type SpaceType = 
  | 'normal'
  | 'plot-twist'
  | 'skip-turn'
  | 'double-contribution'
  | 'wildcard'
  | 'rewind'
  | 'bonus-roll'
  | 'collaboration';

// Prompt Card Types
export interface PromptCard {
  id: string;
  promptType: PromptType;
  promptText: string;
  presetOptions: string[];
}

// Socket Event Types
export interface ClientToServerEvents {
  'create-room': (data: { playerName: string }) => void;
  'join-room': (data: { roomId: string; playerName: string }) => void;
  'leave-room': (data: { roomId: string }) => void;
  'update-settings': (data: { roomId: string; settings: Partial<GameSettings> }) => void;
  'toggle-ready': (data: { roomId: string }) => void;
  'start-game': (data: { roomId: string }) => void;
  'roll-dice': (data: { roomId: string }) => void;
  'submit-answer': (data: { roomId: string; answer: string }) => void;
  'vote-contribution': (data: { roomId: string; contributionIndex: number }) => void;
  'guess-role': (data: { roomId: string; playerId: string; guessedRole: PlayerRole }) => void;
}

export interface ServerToClientEvents {
  'room-created': (data: { roomId: string; room: GameRoom }) => void;
  'player-joined': (data: { room: GameRoom }) => void;
  'player-left': (data: { room: GameRoom }) => void;
  'settings-updated': (data: { room: GameRoom }) => void;
  'game-started': (data: { room: GameRoom; roles: Map<string, PlayerRole> }) => void;
  'dice-rolled': (data: { playerId: string; roll: number; newPosition: number }) => void;
  'prompt-drawn': (data: { prompt: PromptCard }) => void;
  'answer-submitted': (data: { contribution: StoryContribution }) => void;
  'turn-changed': (data: { playerId: string }) => void;
  'voting-phase': (data: { story: StoryContribution[] }) => void;
  'game-ended': (data: { winner: Player; finalStory: StoryContribution[]; roles: Map<string, PlayerRole> }) => void;
  'error': (data: { message: string }) => void;
}

// Story Pack Types
export interface StoryPack {
  id: string;
  name: string;
  description: string;
  theme: string;
  prompts: PromptCard[];
  price: number;
  isDefault: boolean;
}

// Customization Types
export interface GamePiece {
  id: string;
  name: string;
  imageUrl: string;
  isAnimated: boolean;
  price: number;
  isDefault: boolean;
}

export interface BoardTheme {
  id: string;
  name: string;
  backgroundUrl: string;
  isAnimated: boolean;
  price: number;
  isDefault: boolean;
}

export interface UserProfile {
  discordId: string;
  username: string;
  avatar: string;
  ownedContent: string[]; // IDs of purchased items
  stats: PlayerStats;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalVotes: number;
  favoriteRole?: PlayerRole;
}
TYPESINDEX

echo "Shared types setup complete!"
echo ""
echo "✅ All setup scripts completed!"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: npm run dev"
echo "3. Open http://localhost:5173 in your browser"
