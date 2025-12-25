// Player Types
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isAFK: boolean;
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
  boardLength: number; // 15, 20, 30, or 50
  turnTimer: number; // seconds: 30, 60, 90, 120, 150, 180, or 0 (unlimited)
  maxPlayers: number; // 3-10
  votingEnabled: boolean;
  selectedStoryPack: string; // Story pack ID
  
  // Board generation settings
  maxBranchPaths: number; // 2, 3, or 4 paths per split
  branchSelectionMode: BranchSelectionMode; // How players choose paths
  randomizationLevel: RandomizationLevel; // How chaotic the board generation is
}

export type BranchSelectionMode = 
  | 'random' // Automatic random choice
  | 'player-choice' // Player chooses
  | 'dice-roll'; // Roll 3-sided or 6-sided die

export type RandomizationLevel = 
  | 'low' // Predictable, fewer branches, similar lengths
  | 'medium' // Balanced randomization
  | 'high'; // Maximum chaos - many branches, varied lengths, nested branches

// Turn timer options
export const TURN_TIMER_OPTIONS = [
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '1.5 minutes', value: 90 },
  { label: '2 minutes', value: 120 },
  { label: '2.5 minutes', value: 150 },
  { label: '3 minutes', value: 180 },
  { label: 'Unlimited', value: 0 }
];

// Board length options
export const BOARD_LENGTH_OPTIONS = [
  { label: '15 spaces (~20 min)', value: 15 },
  { label: '20 spaces (~30 min)', value: 20 },
  { label: '30 spaces (~45 min)', value: 30 },
  { label: '50 spaces (~1 hr)', value: 50 }
];

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
  
  // Branch information
  branchId?: string; // e.g., "10-0" (split at position 10, path 0)
  branchIndex?: number; // Which branch path (0, 1, 2, 3)
  branchCount?: number; // For split/join markers - how many paths
  
  // Rendering positions (calculated later)
  x?: number;
  y?: number;
}


export type SpaceType = 
  | 'normal'
  | 'plot-twist'
  | 'skip-turn'
  | 'double-contribution'
  | 'wildcard'
  | 'rewind'
  | 'bonus-roll'
  | 'collaboration'
  | 'branch-split' // Marker for where paths split
  | 'branch-join'; // Marker for where paths rejoin

// Prompt Card Types
export interface PromptCard {
  id: string;
  promptType: PromptType;
  promptText: string;
  presetOptions: string[];
}

// Socket Event Types
export interface ClientToServerEvents {
  'create-room': (data: { playerName: string; instanceId: string }) => void;
  'join-room': (data: { instanceId: string; playerName: string }) => void;
  'leave-room': (data: { instanceId: string }) => void;
  'update-settings': (data: { instanceId: string; settings: Partial<GameSettings> }) => void;
  'toggle-ready': (data: { instanceId: string }) => void;
  'toggle-afk': (data: { instanceId: string }) => void;
  'start-game': (data: { instanceId: string; allowSolo?: boolean }) => void;  // <-- Updated this line
  'roll-dice': (data: { instanceId: string }) => void;
  'submit-answer': (data: { instanceId: string; answer: string }) => void;
  'vote-contribution': (data: { instanceId: string; contributionIndex: number }) => void;
  'guess-role': (data: { instanceId: string; playerId: string; guessedRole: PlayerRole }) => void;
}

export interface ServerToClientEvents {
  'room-created': (data: { instanceId: string; room: GameRoom }) => void;
  'player-joined': (data: { room: GameRoom }) => void;
  'player-left': (data: { room: GameRoom }) => void;
  'settings-updated': (data: { room: GameRoom }) => void;
  'player-ready-changed': (data: { room: GameRoom }) => void;
  'player-afk-changed': (data: { room: GameRoom }) => void;
  'game-started': (data: { room: GameRoom; roles: Map<string, PlayerRole> }) => void;
  'dice-rolled': (data: { playerId: string; roll: number; newPosition: number }) => void;
  'prompt-drawn': (data: { prompt: PromptCard }) => void;
  'answer-submitted': (data: { contribution: StoryContribution }) => void;
  'turn-changed': (data: { playerId: string }) => void;
  'voting-phase': (data: { story: StoryContribution[] }) => void;
  'game-ended': (data: { winner: Player; finalStory: StoryContribution[]; roles: Map<string, PlayerRole> }) => void;
  'error': (data: { message: string }) => void;
}

// Story Pack Types (for shop/customization)
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