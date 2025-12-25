import { DiscordSDK, Events } from '@discord/embedded-app-sdk';

class DiscordClientSingleton {
  private sdk: DiscordSDK | null = null;
  private initialized = false;

  async initialize(): Promise<DiscordSDK> {
    if (this.sdk) return this.sdk;

    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
    
    if (!clientId) {
      throw new Error('VITE_DISCORD_CLIENT_ID not found in environment variables');
    }

    this.sdk = new DiscordSDK(clientId);

    await this.sdk.ready();
    
    // Authorize with Discord
    const { code } = await this.sdk.commands.authorize({
      client_id: clientId,
      response_type: 'code',
      state: '',
      prompt: 'none',
      scope: [
        'identify',
        'guilds',
      ],
    });

    // Exchange code for access token (you'll need to implement backend endpoint)
    // For now, we'll store the code
    console.log('Discord authorization code:', code);

    this.initialized = true;
    return this.sdk;
  }

  getSDK(): DiscordSDK | null {
    return this.sdk;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Get current instance (session) ID
  getInstanceId(): string | null {
    return this.sdk?.instanceId || null;
  }

  // Get current channel ID
  getChannelId(): string | null {
    return this.sdk?.channelId || null;
  }

  // Get current guild (server) ID
  getGuildId(): string | null {
    return this.sdk?.guildId || null;
  }

  // Get participant info
  async getParticipants() {
    if (!this.sdk) return [];
    
    try {
      const participants = await this.sdk.commands.getInstanceConnectedParticipants();
      return participants.participants;
    } catch (error) {
      console.error('Failed to get participants:', error);
      return [];
    }
  }

  // Subscribe to participant updates
  onParticipantUpdate(callback: (participants: any[]) => void) {
    if (!this.sdk) return () => {};

    const unsubscribe = this.sdk.subscribe(
      Events.ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE,
      (data: any) => {
        callback(data.participants);
      }
    );

    return unsubscribe;
  }
}

export const DiscordClient = new DiscordClientSingleton();
