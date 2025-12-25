import { BoardSpace } from '@shared/types';

export class MovementHelper {
  /**
   * Calculate the actual path a player takes when moving N spaces
   */
  static calculateMovement(
    boardSpaces: BoardSpace[],
    currentPosition: number,
    roll: number,
    branchChoice?: number
  ): number[] {
    const path: number[] = [];
    let position = currentPosition;
    
    for (let i = 0; i < roll; i++) {
      const currentSpace = boardSpaces.find(s => s.position === position);
      if (!currentSpace) break;
      
      // Find next space
      const nextSpace = this.getNextSpace(boardSpaces, currentSpace, branchChoice);
      if (!nextSpace) break;
      
      position = nextSpace.position;
      path.push(position);
    }
    
    return path;
  }
  
  /**
   * Get the next space from current position
   */
  private static getNextSpace(
    boardSpaces: BoardSpace[],
    currentSpace: BoardSpace,
    branchChoice?: number
  ): BoardSpace | null {
    const currentIndex = boardSpaces.findIndex(s => s.position === currentSpace.position);
    if (currentIndex === -1) return null;
    
    // If current space is a branch split, choose a branch
    if (currentSpace.type === 'branch-split') {
      const branchCount = currentSpace.branchCount || 2;
      const chosenBranch = branchChoice ?? Math.floor(Math.random() * branchCount);
      const branchId = `${currentSpace.position}-${chosenBranch}`;
      
      // Find first space in chosen branch
      return boardSpaces.find(s => s.branchId === branchId) || null;
    }
    
    // If we're in a branch, continue along it
    if (currentSpace.branchId) {
      const branchSpaces = boardSpaces.filter(s => s.branchId === currentSpace.branchId);
      const indexInBranch = branchSpaces.findIndex(s => s.position === currentSpace.position);
      
      if (indexInBranch < branchSpaces.length - 1) {
        // Next space in branch
        return branchSpaces[indexInBranch + 1];
      } else {
        // End of branch, find the join point
        const joinPoint = boardSpaces.find(s => 
          s.type === 'branch-join' && s.position > currentSpace.position
        );
        return joinPoint || null;
      }
    }
    
    // Normal movement - just next space in array
    return boardSpaces[currentIndex + 1] || null;
  }
}