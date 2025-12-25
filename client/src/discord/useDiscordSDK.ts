import { useEffect, useState } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import { DiscordClient } from './DiscordClient';

export function useDiscordSDK() {
  const [sdk, setSDK] = useState<DiscordSDK | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    DiscordClient.initialize()
      .then((initializedSDK) => {
        setSDK(initializedSDK);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to initialize Discord SDK:', err);
        setError(err);
        setLoading(false);
      });
  }, []);

  return { sdk, loading, error, isDiscord: !!sdk };
}
