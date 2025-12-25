import React from 'react';
import { Player } from '@shared/types';
import styles from './PlayerList.module.css';

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
}

export function PlayerList({ players, currentPlayerId }: PlayerListProps) {
  return (
    <div className={styles.playerList}>
      <h3 className={styles.title}>Players ({players.length})</h3>
      
      <div className={styles.list}>
        {players.length === 0 ? (
          <p className={styles.noPlayers}>No players yet</p>
        ) : (
          players.map((player) => (
            <div 
              key={player.id}
              className={`${styles.playerCard} ${player.id === currentPlayerId ? styles.currentPlayer : ''}`}
            >
              <div className={styles.playerInfo}>
                <span className={styles.playerName}>{player.name}</span>
                <div className={styles.badges}>
                  {player.isHost && (
                    <span className={styles.badge} style={{ background: '#FFD700', color: '#333' }}>
                      HOST
                    </span>
                  )}
                  {player.isReady && !player.isAFK && (
                    <span className={styles.badge} style={{ background: '#4CAF50' }}>
                      READY
                    </span>
                  )}
                  {player.isAFK && (
                    <span className={styles.badge} style={{ background: '#9E9E9E' }}>
                      AFK
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}