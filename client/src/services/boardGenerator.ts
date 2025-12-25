import { BoardSpace, SpaceType, GameSettings } from '@shared/types';

export class BoardGenerator {
  private settings: GameSettings;
  private spaceCounter = 0; // Use a global counter instead of currentPosition
  
  constructor(settings: GameSettings) {
    this.settings = settings;
  }

  /**
   * Generate the complete board with branches
   */
  generateBoard(): BoardSpace[] {
    const spaces: BoardSpace[] = [];
    this.spaceCounter = 0;

    // TEMPORARILY DISABLE BRANCHES FOR TESTING
    // Calculate number of splits based on board length
    const numSplits = 0; // this.calculateSplitCount();
    const splitPositions = this.calculateSplitPositions(numSplits);

    let nextSplitIndex = 0;
    let normalSpaceCount = 0;

    while (normalSpaceCount < this.settings.boardLength) {
      // Check if we should create a split
      if (nextSplitIndex < splitPositions.length && 
          normalSpaceCount >= splitPositions[nextSplitIndex]) {
        
        const branchSpaces = this.generateBranch();
        spaces.push(...branchSpaces);
        nextSplitIndex++;
        // Don't increment normalSpaceCount - branches don't count toward total
      } else {
        // Normal space
        spaces.push(this.createSpace(this.spaceCounter++));
        normalSpaceCount++;
      }
    }

    return spaces;
  }

  /**
   * Calculate how many splits based on board length and randomization
   */
  private calculateSplitCount(): number {
    const { boardLength, randomizationLevel } = this.settings;
    
    let baseSplits = 0;
    if (boardLength === 15) baseSplits = 1;
    else if (boardLength === 20) baseSplits = Math.random() < 0.5 ? 1 : 2;
    else if (boardLength === 30) baseSplits = 2;
    else if (boardLength === 50) baseSplits = Math.floor(Math.random() * 2) + 3; // 3-4

    // Adjust based on randomization level
    if (randomizationLevel === 'high') {
      baseSplits += Math.floor(Math.random() * 2); // +0 to +1
    } else if (randomizationLevel === 'low') {
      baseSplits = Math.max(1, baseSplits - 1);
    }

    return baseSplits;
  }

  /**
   * Calculate positions where splits occur
   */
  private calculateSplitPositions(numSplits: number): number[] {
    const positions: number[] = [];
    const { boardLength } = this.settings;
    
    // Divide board into sections
    const sectionSize = Math.floor(boardLength / (numSplits + 1));
    
    for (let i = 0; i < numSplits; i++) {
      const basePosition = sectionSize * (i + 1);
      const variance = Math.floor(sectionSize * 0.3);
      const position = basePosition + Math.floor(Math.random() * variance * 2) - variance;
      positions.push(Math.max(5, Math.min(boardLength - 10, position)));
    }

    return positions.sort((a, b) => a - b);
  }

  /**
   * Generate a branch (split and rejoin)
   */
  private generateBranch(): BoardSpace[] {
    const spaces: BoardSpace[] = [];
    const { maxBranchPaths, randomizationLevel } = this.settings;
    
    // Determine number of paths (2-4)
    let numPaths = Math.floor(Math.random() * (maxBranchPaths - 1)) + 2;
    
    // Determine branch length for each path
    const minLength = randomizationLevel === 'low' ? 3 : 2;
    const maxLength = randomizationLevel === 'high' ? 7 : 5;
    
    const pathLengths: number[] = [];
    for (let i = 0; i < numPaths; i++) {
      pathLengths.push(Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength);
    }

    // Split marker
    const splitSpace = this.createSpace(this.spaceCounter++, 'branch-split');
    splitSpace.branchCount = numPaths;
    const splitPosition = splitSpace.position;
    spaces.push(splitSpace);

    // Generate each path
    for (let pathIndex = 0; pathIndex < numPaths; pathIndex++) {
      const pathLength = pathLengths[pathIndex];
      
      for (let i = 0; i < pathLength; i++) {
        const space = this.createSpace(
          this.spaceCounter++,
          this.randomSpaceType()
        );
        space.branchId = `${splitPosition}-${pathIndex}`;
        space.branchIndex = pathIndex;
        spaces.push(space);
      }
    }

    // Rejoin marker
    const rejoinSpace = this.createSpace(this.spaceCounter++, 'branch-join');
    rejoinSpace.branchCount = numPaths;
    spaces.push(rejoinSpace);

    return spaces;
  }

  /**
   * Create a single board space
   */
  private createSpace(position: number, type?: SpaceType): BoardSpace {
    return {
      position,
      type: type || this.randomSpaceType(),
      x: 0,
      y: 0
    };
  }

  /**
   * Randomly select a space type based on distribution
   */
  private randomSpaceType(): SpaceType {
    const rand = Math.random();
    
    // 70% normal, 30% special
    if (rand < 0.7) return 'normal';
    
    // Special space distribution
    const specialRand = Math.random();
    if (specialRand < 0.15) return 'plot-twist';
    if (specialRand < 0.30) return 'skip-turn';
    if (specialRand < 0.45) return 'double-contribution';
    if (specialRand < 0.60) return 'wildcard';
    if (specialRand < 0.75) return 'rewind';
    if (specialRand < 0.90) return 'bonus-roll';
    return 'collaboration';
  }
}