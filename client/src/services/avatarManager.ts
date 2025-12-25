import * as PIXI from 'pixi.js';

interface AvatarCache {
  texture: PIXI.Texture;
  timestamp: number;
}

export class AvatarManager {
  private cache: Map<string, AvatarCache> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

  /**
   * Get Discord avatar URL
   */
  getAvatarUrl(userId: string, avatarHash?: string, discriminator?: string): string {
    if (avatarHash) {
      // Custom avatar
      const extension = avatarHash.startsWith('a_') ? 'gif' : 'png';
      return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=128`;
    } else {
      // Default avatar (based on discriminator)
      const defaultIndex = discriminator ? parseInt(discriminator) % 5 : 0;
      return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
    }
  }

  /**
   * Load avatar as PixiJS texture
   */
  async loadAvatar(userId: string, avatarUrl: string): Promise<PIXI.Texture> {
    // Check cache
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.texture;
    }

    try {
      // Load texture
      const texture = await PIXI.Assets.load(avatarUrl);
      
      // Cache it
      this.cache.set(userId, {
        texture,
        timestamp: Date.now()
      });

      return texture;
    } catch (error) {
      console.error(`Failed to load avatar for ${userId}:`, error);
      
      // Return a default texture (colored circle)
      return this.createDefaultTexture();
    }
  }

  /**
   * Create a default texture for when avatar fails to load
   */
  private createDefaultTexture(): PIXI.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Draw a gradient circle
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(64, 64, 64, 0, Math.PI * 2);
    ctx.fill();

    return PIXI.Texture.from(canvas);
  }

  /**
   * Clear old cached avatars
   */
  clearOldCache() {
    const now = Date.now();
    for (const [userId, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        cached.texture.destroy();
        this.cache.delete(userId);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAll() {
    for (const cached of this.cache.values()) {
      cached.texture.destroy();
    }
    this.cache.clear();
  }
}