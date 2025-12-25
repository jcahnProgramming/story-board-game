import { BoardGenerator } from './boardGenerator';
import { GameSettings } from '@shared/types';

export function testBoardGenerator() {
  const settings: GameSettings = {
    boardLength: 30,
    turnTimer: 60,
    maxPlayers: 8,
    votingEnabled: true,
    selectedStoryPack: 'family-friendly',
    maxBranchPaths: 3,
    branchSelectionMode: 'player-choice',
    randomizationLevel: 'high'
  };

  const generator = new BoardGenerator(settings);
  const board = generator.generateBoard();

  console.log('=== BOARD GENERATED ===');
  console.log(`Total spaces: ${board.length}`);
  
  const splits = board.filter(s => s.type === 'branch-split');
  const joins = board.filter(s => s.type === 'branch-join');
  console.log(`Splits: ${splits.length}, Joins: ${joins.length}`);
  
  board.forEach(space => {
    const branchInfo = space.branchId ? ` [Branch: ${space.branchId}]` : '';
    const splitInfo = space.branchCount ? ` (${space.branchCount} paths)` : '';
    console.log(`${space.position}: ${space.type}${branchInfo}${splitInfo}`);
  });

  return board;
}

// Make it available globally for testing
(window as any).testBoard = testBoardGenerator;