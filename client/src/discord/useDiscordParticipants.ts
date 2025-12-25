import { useEffect, useState } from 'react';
import { DiscordClient } from './DiscordClient';

export interface DiscordParticipant {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  bot: boolean;
}

export function useDiscordParticipants() {
  const [participants, setParticipants] = useState<DiscordParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadParticipants = async () => {
      const currentParticipants = await DiscordClient.getParticipants();
      setParticipants(currentParticipants);
      setLoading(false);

      // Subscribe to updates
      unsubscribe = DiscordClient.onParticipantUpdate((updated) => {
        setParticipants(updated);
      });
    };

    loadParticipants();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { participants, loading };
}
