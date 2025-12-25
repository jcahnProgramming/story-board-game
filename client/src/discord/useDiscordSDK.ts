import { useEffect, useState } from 'react';
import { DiscordClient } from './DiscordClient';

export function useDiscordSDK() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initializeDiscord() {
      try {
        console.log('Initializing Discord SDK...');
        await DiscordClient.initialize();
        console.log('Discord SDK initialized successfully');
        setLoading(false);
      } catch (err) {
        console.error('Discord SDK initialization error:', err);
        setError(err as Error);
        setLoading(false);
      }
    }

    initializeDiscord();
  }, []);

  return { loading, error };
}