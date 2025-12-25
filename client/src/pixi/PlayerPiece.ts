import * as PIXI from 'pixi.js';

export class PlayerPiece {
  private container: PIXI.Container;
  private coin: PIXI.Graphics;
  private avatar: PIXI.Sprite | null = null;
  private label: PIXI.Text;
  private playerId: string;
  private playerName: string;
  private currentX: number = 0;
  private currentY: number = 0;

  constructor(playerId: string, playerName: string, color: number = 0x4a90e2) {
    this.playerId = playerId;
    this.playerName = playerName;
    this.container = new PIXI.Container();

    // Create coin-style piece
    this.coin = this.createCoin(color);
    this.container.addChild(this.coin);

    // Create username label
    this.label = new PIXI.Text(playerName, {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xffffff,
      fontWeight: 'bold',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 4,
      dropShadowDistance: 2,
    });
    this.label.anchor.set(0.5);
    this.label.position.set(0, -50); // Above the coin
    this.container.addChild(this.label);

    // Make interactive
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';
  }

  /**
   * Create a 3D-looking coin
   */
  private createCoin(color: number): PIXI.Graphics {
    const graphics = new PIXI.Graphics();
    const radius = 30;

    // Shadow (bottom layer)
    graphics.beginFill(0x000000, 0.3);
    graphics.drawCircle(2, 2, radius);
    graphics.endFill();

    // Main coin body with gradient effect
    graphics.beginFill(color);
    graphics.drawCircle(0, 0, radius);
    graphics.endFill();

    // Highlight (top-left for 3D effect)
    graphics.beginFill(0xffffff, 0.3);
    graphics.drawCircle(-8, -8, radius * 0.4);
    graphics.endFill();

    // Border
    graphics.lineStyle(3, 0xffffff, 0.8);
    graphics.drawCircle(0, 0, radius);

    return graphics;
  }

  /**
   * Set avatar texture (for future Discord avatars)
   */
  setAvatar(texture: PIXI.Texture) {
    if (this.avatar) {
      this.avatar.destroy();
    }

    this.avatar = new PIXI.Sprite(texture);
    this.avatar.anchor.set(0.5);
    this.avatar.width = 50;
    this.avatar.height = 50;

    // Create circular mask
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawCircle(0, 0, 25);
    mask.endFill();
    this.avatar.mask = mask;

    this.container.addChildAt(this.avatar, 1); // Add above coin, below label
    this.container.addChild(mask);
  }

  /**
   * Get the container
   */
  getContainer(): PIXI.Container {
    return this.container;
  }

  /**
   * Set position on board
   */
  setPosition(x: number, y: number) {
    this.currentX = x;
    this.currentY = y;
    this.container.position.set(x, y);
  }

  /**
   * Get current position
   */
  getPosition(): { x: number; y: number } {
    return { x: this.currentX, y: this.currentY };
  }

  /**
   * Animate movement to new position (for later)
   */
  async moveTo(x: number, y: number, duration: number = 500): Promise<void> {
    return new Promise((resolve) => {
      const startX = this.currentX;
      const startY = this.currentY;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const eased = 1 - Math.pow(1 - progress, 3);

        this.currentX = startX + (x - startX) * eased;
        this.currentY = startY + (y - startY) * eased;
        this.container.position.set(this.currentX, this.currentY);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.avatar) {
      this.avatar.destroy();
    }
    this.container.destroy({ children: true });
  }
}