import { DiscordSDK } from '@discord/embedded-app-sdk';

export class DiscordClient {
  private static discordSdk: DiscordSDK | null = null;
  private static instanceId: string | null = null;

  /**
   * Initialize the Discord SDK
   */
  static async initialize(): Promise<void> {
    if (this.discordSdk) {
      return; // Already initialized
    }

    this.discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

    try {
      await this.discordSdk.ready();
      console.log('✅ Discord SDK ready');

      // Get instance ID (session ID)
      this.instanceId = this.discordSdk.instanceId;
      console.log('Instance ID:', this.instanceId);

      // Authorize the user
      await this.discordSdk.commands.authorize({
        client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
        response_type: 'code',
        state: '',
        prompt: 'none',
        scope: ['identify', 'guilds'],
      });

      console.log('✅ User authorized');
    } catch (error) {
      console.error('Failed to initialize Discord SDK:', error);
      throw error;
    }
  }

  /**
   * Get the Discord SDK instance
   */
  static getSDK(): DiscordSDK | null {
    return this.discordSdk;
  }

  /**
   * Get the current instance ID (session ID)
   */
  static getInstanceId(): string {
    return this.instanceId || '';
  }

  /**
   * Get voice channel participants
   */
  static async getParticipants() {
    if (!this.discordSdk) {
      throw new Error('Discord SDK not initialized');
    }

    try {
      const channel = await this.discordSdk.commands.getChannel({
        channel_id: this.discordSdk.channelId!,
      });

      return channel?.voice_states || [];
    } catch (error) {
      console.error('Failed to get participants:', error);
      return [];
    }
  }

  /**
   * Subscribe to participant updates
   */
  static onParticipantUpdate(callback: (participants: any[]) => void) {
    if (!this.discordSdk) {
      throw new Error('Discord SDK not initialized');
    }

    this.discordSdk.subscribe('VOICE_STATE_UPDATE', async () => {
      const participants = await this.getParticipants();
      callback(participants);
    });
  }
}