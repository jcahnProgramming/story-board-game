import * as PIXI from 'pixi.js';
import { BoardSpace, Player } from '@shared/types';
import { PlayerPiece } from './PlayerPiece';

export class GameBoard {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private camera: PIXI.Container;
  private spaces: Map<number, PIXI.Graphics> = new Map();
  private boardData: BoardSpace[] = [];
  private players: Map<string, PlayerPiece> = new Map();
  
  // Player colors
  private playerColors = [
    0x4a90e2, // Blue
    0xe74c3c, // Red
    0x2ecc71, // Green
    0xf39c12, // Orange
    0x9b59b6, // Purple
    0x1abc9c, // Teal
    0xe67e22, // Dark Orange
    0x3498db, // Light Blue
  ];
  
  // Camera settings
  private targetZoom = 1;
  private targetX = 0;
  private targetY = 0;
  private currentZoom = 1;
  private isOverviewMode = false;
  private isAnimating = false; // Flag to disable auto-lerp during manual animations

  constructor(canvas: HTMLCanvasElement) {
    // Initialize PixiJS application
    this.app = new PIXI.Application({
      view: canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Create camera container (for zoom/pan)
    this.camera = new PIXI.Container();
    this.app.stage.addChild(this.camera);

    // Create board container
    this.container = new PIXI.Container();
    this.camera.addChild(this.container);

    // Center camera
    this.camera.position.set(this.app.screen.width / 2, this.app.screen.height / 2);

    // Start game loop
    this.app.ticker.add(this.update.bind(this));

    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * Generate and render the board
   */
  generateBoard(boardSpaces: BoardSpace[]) {
    this.boardData = boardSpaces;
    this.clearBoard();
    
    // Calculate layout positions
    this.calculateLayout();
    
    // Render connections first (so they appear behind spaces)
    this.renderConnections();
    
    // Render all spaces on top
    this.renderSpaces();
    
    // Fit board to view
    this.fitBoardToView();
  }

  /**
   * Calculate X,Y positions for all spaces with proper branching
   */
  private calculateLayout() {
    const SPACE_SPACING = 150;
    const BRANCH_SPACING = 120; // Vertical space between branch paths
    
    let currentX = 0;
    const baseY = 0;
    
    // Track active branches
    interface BranchInfo {
      splitPosition: number;
      pathCount: number;
      pathLengths: Map<number, number>;
      maxLength: number;
    }
    
    const activeBranches: BranchInfo[] = [];
    const spacePositions = new Map<number, { x: number; y: number }>();

    for (let i = 0; i < this.boardData.length; i++) {
      const space = this.boardData[i];
      
      if (space.type === 'branch-split') {
        // Start of a branch
        space.x = currentX;
        space.y = baseY;
        spacePositions.set(space.position, { x: currentX, y: baseY });
        
        // Find all spaces in this branch
        const branchCount = space.branchCount || 2;
        const branchInfo: BranchInfo = {
          splitPosition: space.position,
          pathCount: branchCount,
          pathLengths: new Map(),
          maxLength: 0
        };
        
        // Calculate how many spaces in each path
        for (let pathIndex = 0; pathIndex < branchCount; pathIndex++) {
          const branchId = `${space.position}-${pathIndex}`;
          const pathSpaces = this.boardData.filter(s => s.branchId === branchId);
          branchInfo.pathLengths.set(pathIndex, pathSpaces.length);
          branchInfo.maxLength = Math.max(branchInfo.maxLength, pathSpaces.length);
        }
        
        activeBranches.push(branchInfo);
        currentX += SPACE_SPACING;
        
      } else if (space.type === 'branch-join') {
        // End of a branch
        const branchInfo = activeBranches.pop();
        
        if (branchInfo) {
          // Position join point after the longest branch path
          currentX = spacePositions.get(branchInfo.splitPosition)!.x + 
                     (branchInfo.maxLength + 1) * SPACE_SPACING;
        }
        
        space.x = currentX;
        space.y = baseY;
        spacePositions.set(space.position, { x: currentX, y: baseY });
        currentX += SPACE_SPACING;
        
      } else if (space.branchId) {
        // Space on a branch path
        const branchIndex = space.branchIndex ?? 0;
        const branchInfo = activeBranches[activeBranches.length - 1];
        
        if (branchInfo) {
          // Calculate Y offset for this branch path
          const totalHeight = (branchInfo.pathCount - 1) * BRANCH_SPACING;
          const startY = baseY - totalHeight / 2;
          const branchY = startY + (branchIndex * BRANCH_SPACING);
          
          // Find how many spaces into this branch path we are
          const branchId = space.branchId;
          const pathSpaces = this.boardData.filter(s => s.branchId === branchId);
          const indexInPath = pathSpaces.findIndex(s => s.position === space.position);
          
          // Position relative to split point
          const splitX = spacePositions.get(branchInfo.splitPosition)!.x;
          space.x = splitX + (indexInPath + 1) * SPACE_SPACING;
          space.y = branchY;
          spacePositions.set(space.position, { x: space.x, y: space.y });
        }
        
      } else {
        // Normal straight path space
        space.x = currentX;
        space.y = baseY;
        spacePositions.set(space.position, { x: currentX, y: baseY });
        currentX += SPACE_SPACING;
      }
    }
  }

  /**
   * Render connections between spaces (with proper branching)
   */
  private renderConnections() {
    const lineGraphics = new PIXI.Graphics();
    
    for (let i = 0; i < this.boardData.length - 1; i++) {
      const current = this.boardData[i];
      const next = this.boardData[i + 1];
      
      // Skip if positions are undefined
      if (current.x === undefined || current.y === undefined ||
          next.x === undefined || next.y === undefined) {
        continue;
      }
      
      let shouldConnect = false;
      
      if (current.type === 'branch-split') {
        // Split connects to ALL first spaces of each branch
        const branchCount = current.branchCount || 2;
        for (let pathIdx = 0; pathIdx < branchCount; pathIdx++) {
          const branchId = `${current.position}-${pathIdx}`;
          const firstInBranch = this.boardData.find(s => s.branchId === branchId);
          
          if (firstInBranch && firstInBranch.x !== undefined && firstInBranch.y !== undefined) {
            lineGraphics.lineStyle(3, 0xffffff, 0.3);
            lineGraphics.moveTo(current.x, current.y);
            lineGraphics.lineTo(firstInBranch.x, firstInBranch.y);
          }
        }
        // Don't connect split to next in sequence
        continue;
        
      } else if (current.type === 'branch-join') {
        // Join was already connected to by last branch spaces
        // Connect join to next normal space
        if (next.type !== 'branch-split' && !next.branchId) {
          shouldConnect = true;
        }
        
      } else if (current.branchId && next.branchId) {
        // Both in branches - only connect if same branch
        if (current.branchId === next.branchId) {
          shouldConnect = true;
        } else {
          // Different branches, check if current is last in its branch
          const currentBranchSpaces = this.boardData.filter(s => s.branchId === current.branchId);
          const isLastInBranch = currentBranchSpaces[currentBranchSpaces.length - 1].position === current.position;
          
          if (isLastInBranch) {
            // Find the join point
            const joinPoint = this.boardData.find(s => 
              s.type === 'branch-join' && s.position > current.position
            );
            
            if (joinPoint && joinPoint.x !== undefined && joinPoint.y !== undefined) {
              lineGraphics.lineStyle(3, 0xffffff, 0.3);
              lineGraphics.moveTo(current.x, current.y);
              lineGraphics.lineTo(joinPoint.x, joinPoint.y);
            }
          }
        }
        
      } else if (current.branchId && !next.branchId) {
        // Current in branch, next is not
        // This means current is last in its branch, connect to join
        const joinPoint = this.boardData.find(s => 
          s.type === 'branch-join' && s.position === next.position
        );
        
        if (joinPoint) {
          shouldConnect = true;
        }
        
      } else if (!current.branchId && !next.branchId) {
        // Both on main path
        if (current.type !== 'branch-split' && next.type !== 'branch-split') {
          shouldConnect = true;
        } else if (next.type === 'branch-split') {
          // Connect to upcoming split
          shouldConnect = true;
        }
      }
      
      // Draw the connection
      if (shouldConnect) {
        lineGraphics.lineStyle(3, 0xffffff, 0.3);
        lineGraphics.moveTo(current.x, current.y);
        lineGraphics.lineTo(next.x, next.y);
      }
    }
    
    // Add connections to back (behind spaces)
    this.container.addChildAt(lineGraphics, 0);
  }

  /**
   * Render all board spaces
   */
  private renderSpaces() {
    this.boardData.forEach(space => {
      const graphics = this.createSpaceGraphic(space);
      graphics.position.set(space.x || 0, space.y || 0);
      this.container.addChild(graphics);
      this.spaces.set(space.position, graphics);
    });
  }

  /**
   * Create visual representation of a space
   */
  private createSpaceGraphic(space: BoardSpace): PIXI.Graphics {
    const graphics = new PIXI.Graphics();
    const radius = 40;
    
    // Get color based on space type
    const color = this.getSpaceColor(space.type);
    
    // Draw circle
    graphics.beginFill(color);
    graphics.lineStyle(4, 0xffffff, 0.8);
    graphics.drawCircle(0, 0, radius);
    graphics.endFill();
    
    // Add position number
    const text = new PIXI.Text(space.position.toString(), {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    text.anchor.set(0.5);
    graphics.addChild(text);
    
    // Make interactive
    graphics.eventMode = 'static';
    graphics.cursor = 'pointer';
    graphics.on('pointerover', () => {
      graphics.scale.set(1.1);
    });
    graphics.on('pointerout', () => {
      graphics.scale.set(1);
    });
    
    return graphics;
  }

  /**
   * Get color for space type
   */
  private getSpaceColor(type: string): number {
    const colors: Record<string, number> = {
      'normal': 0x4a90e2,
      'plot-twist': 0x9b59b6,
      'skip-turn': 0x95a5a6,
      'double-contribution': 0x2ecc71,
      'wildcard': 0xf39c12,
      'rewind': 0x3498db,
      'bonus-roll': 0xffd700,
      'collaboration': 0xe74c3c,
      'branch-split': 0xff6b6b,
      'branch-join': 0x51cf66,
    };
    return colors[type] || 0x4a90e2;
  }

  /**
   * Update players on the board
   */
  updatePlayers(players: Player[]) {
    // Remove players that left
    for (const [playerId, piece] of this.players.entries()) {
      if (!players.find(p => p.id === playerId)) {
        piece.destroy();
        this.players.delete(playerId);
      }
    }

    // Add or update players
    players.forEach((player, index) => {
      let piece = this.players.get(player.id);

      if (!piece) {
        // Create new player piece
        const color = this.playerColors[index % this.playerColors.length];
        piece = new PlayerPiece(player.id, player.name, color);
        this.players.set(player.id, piece);
        this.container.addChild(piece.getContainer());
        
        // Set initial position (by index, not position number)
        if (player.position < this.boardData.length) {
          const space = this.boardData[player.position];
          if (space && space.x !== undefined && space.y !== undefined) {
            piece.setPosition(space.x, space.y);
          }
        }
      } else {
        // Animate to new position (by index)
        if (player.position < this.boardData.length) {
          const space = this.boardData[player.position];
          if (space && space.x !== undefined && space.y !== undefined) {
            const currentPos = piece.getPosition();
            
            // Only animate if position actually changed
            if (currentPos.x !== space.x || currentPos.y !== space.y) {
              piece.moveTo(space.x, space.y, 800); // Slower player movement (was 500ms)
            }
          }
        }
      }
    });
  }

  /**
   * Get players map (for external access)
   */
  getPlayers(): Map<string, PlayerPiece> {
    return this.players;
  }

  /**
   * Fit board to view (overview mode)
   */
  fitBoardToView() {
    if (this.boardData.length === 0) return;
    
    // Find bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    this.boardData.forEach(space => {
      if (space.x !== undefined && space.y !== undefined) {
        minX = Math.min(minX, space.x);
        maxX = Math.max(maxX, space.x);
        minY = Math.min(minY, space.y);
        maxY = Math.max(maxY, space.y);
      }
    });
    
    const boardWidth = maxX - minX + 200;
    const boardHeight = maxY - minY + 200;
    
    const scaleX = this.app.screen.width / boardWidth;
    const scaleY = this.app.screen.height / boardHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    
    this.targetZoom = scale;
    this.targetX = -(minX + (maxX - minX) / 2) * scale;
    this.targetY = -(minY + (maxY - minY) / 2) * scale;
  }

  /**
   * Follow a specific space (by index, not position number) with zoom animation
   */
  followSpace(spaceIndex: number, finalZoom: number = 1.5) {
    if (spaceIndex < 0 || spaceIndex >= this.boardData.length) return;
    
    const space = this.boardData[spaceIndex];
    if (!space || space.x === undefined || space.y === undefined) return;
    
    this.isOverviewMode = false;
    
    // Three-phase animation: zoom out -> pan -> zoom in
    this.animateToSpace(space.x, space.y, finalZoom);
  }

  /**
   * Animate camera to a space with zoom out/in effect
   */
  private animateToSpace(targetX: number, targetY: number, finalZoom: number) {
    this.isAnimating = true;
    
    // Phase 1: Zoom out (slower and smoother)
    const zoomOutLevel = 0.7; // Zoom out more (was 0.8)
    const currentPos = {
      x: -this.container.position.x / this.currentZoom,
      y: -this.container.position.y / this.currentZoom
    };
    
    // Animate zoom out (slower)
    this.animateCamera(
      currentPos.x,
      currentPos.y,
      zoomOutLevel,
      500, // Slower (was 300ms)
      () => {
        // Phase 2: Pan to new location (while zoomed out, slower)
        this.animateCamera(
          targetX,
          targetY,
          zoomOutLevel,
          700, // Slower (was 400ms)
          () => {
            // Phase 3: Zoom back in (slower)
            this.animateCamera(
              targetX,
              targetY,
              finalZoom,
              500, // Slower (was 300ms)
              () => {
                this.isAnimating = false; // Re-enable auto-lerp
              }
            );
          }
        );
      }
    );
  }

  /**
   * Animate camera to target position and zoom with callback
   */
  private animateCamera(
    targetX: number,
    targetY: number,
    targetZoom: number,
    duration: number,
    onComplete?: () => void
  ) {
    const startTime = Date.now();
    const startZoom = this.currentZoom;
    const startX = -this.container.position.x / this.currentZoom;
    const startY = -this.container.position.y / this.currentZoom;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smoother easing function (cubic ease-in-out for more fluid motion)
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      // Update zoom
      this.currentZoom = startZoom + (targetZoom - startZoom) * eased;
      this.container.scale.set(this.currentZoom);
      
      // Update position
      const currentX = startX + (targetX - startX) * eased;
      const currentY = startY + (targetY - startY) * eased;
      this.container.position.x = -currentX * this.currentZoom;
      this.container.position.y = -currentY * this.currentZoom;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Update target values for the main update loop
        this.targetZoom = targetZoom;
        this.targetX = -targetX * targetZoom;
        this.targetY = -targetY * targetZoom;
        
        if (onComplete) {
          onComplete();
        }
      }
    };
    
    animate();
  }

  /**
   * Toggle overview mode
   */
  toggleOverview() {
    this.isOverviewMode = !this.isOverviewMode;
    
    if (this.isOverviewMode) {
      this.fitBoardToView();
    } else {
      // Return to normal zoom
      this.targetZoom = 1.5;
      this.targetX = 0;
      this.targetY = 0;
    }
  }

  /**
   * Update loop (smooth camera movement)
   */
  private update() {
    // Skip auto-lerp if we're in a manual animation
    if (this.isAnimating) return;
    
    // Smooth camera interpolation for user interactions
    const lerp = 0.1;
    
    this.currentZoom += (this.targetZoom - this.currentZoom) * lerp;
    this.container.scale.set(this.currentZoom);
    
    const currentX = this.container.position.x;
    const currentY = this.container.position.y;
    
    this.container.position.x = currentX + (this.targetX - currentX) * lerp;
    this.container.position.y = currentY + (this.targetY - currentY) * lerp;
  }

  /**
   * Handle window resize
   */
  private handleResize() {
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
    this.camera.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
    
    if (this.isOverviewMode) {
      this.fitBoardToView();
    }
  }

  /**
   * Clear the board
   */
  private clearBoard() {
    this.container.removeChildren();
    this.spaces.clear();
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    // Destroy all player pieces
    for (const piece of this.players.values()) {
      piece.destroy();
    }
    this.players.clear();
    
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.app.destroy(true, { children: true });
  }
}