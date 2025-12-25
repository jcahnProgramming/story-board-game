export interface StoryPack {
  id: string;
  name: string;
  description: string;
  theme: string;
  color: string; // For card styling
  icon: string; // Emoji for now, can be image URL later
  isDefault: boolean;
  price: number; // 0 for default packs
}

export const DEFAULT_STORY_PACKS: StoryPack[] = [
  {
    id: 'family-friendly',
    name: 'Family Friendly',
    description: 'Wholesome stories perfect for all ages. Create heartwarming tales with positive themes.',
    theme: 'wholesome',
    color: '#4CAF50',
    icon: '🏡',
    isDefault: true,
    price: 0
  },
  {
    id: 'fantasy-adventure',
    name: 'Fantasy Adventure',
    description: 'Epic quests with dragons, magic, and legendary heroes. Embark on mystical journeys.',
    theme: 'fantasy',
    color: '#9C27B0',
    icon: '🐉',
    isDefault: true,
    price: 0
  },
  {
    id: 'sci-fi-mystery',
    name: 'Sci-Fi Mystery',
    description: 'Explore space, uncover alien secrets, and solve technological puzzles.',
    theme: 'sci-fi',
    color: '#2196F3',
    icon: '🚀',
    isDefault: true,
    price: 0
  },
  {
    id: 'horror-thriller',
    name: 'Horror Thriller',
    description: 'Spooky and suspenseful tales that keep everyone on edge. Not too scary, just right.',
    theme: 'horror',
    color: '#FF5722',
    icon: '👻',
    isDefault: true,
    price: 0
  },
  {
    id: 'comedy-chaos',
    name: 'Comedy Chaos',
    description: 'Silly, absurd, and hilarious stories that will have everyone laughing.',
    theme: 'comedy',
    color: '#FFC107',
    icon: '🤡',
    isDefault: true,
    price: 0
  }
];

export function getStoryPackById(id: string): StoryPack | undefined {
  return DEFAULT_STORY_PACKS.find(pack => pack.id === id);
}