import React, { useState } from 'react';
import { GameRoom, GameSettings } from '@shared/types';
import { SettingsPanel } from './SettingsPanel/SettingsPanel';
import { PlayerList } from './PlayerList/PlayerList';
import { Button } from '../ui/Button/Button';
import { Modal } from '../ui/Modal/Modal';
import styles from './Lobby.module.css';

interface LobbyProps {
  room: GameRoom;
  currentPlayerId: string;
  onSettingsChange: (settings: Partial<GameSettings>) => void;
  onToggleReady: () => void;
  onToggleAFK: () => void;
  onStartGame: (allowSolo?: boolean) => void;
  onLeaveGame: () => void;
}

export function Lobby({
  room,
  currentPlayerId,
  onSettingsChange,
  onToggleReady,
  onToggleAFK,
  onStartGame,
  onLeaveGame
}: LobbyProps) {
  const [showSoloConfirm, setShowSoloConfirm] = useState(false);
  
  const currentPlayer = room.players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost || false;
  const isReady = currentPlayer?.isReady || false;
  const isAFK = currentPlayer?.isAFK || false;

  const activePlayers = room.players.filter(p => !p.isAFK);
  const activePlayerCount = activePlayers.length;

  // Check if we can start the game
  const canStartGame = () => {
    if (!isHost) return false;
    if (activePlayerCount === 0) return false;
    
    // Solo play always allowed
    if (activePlayerCount === 1) return true;
    
    // 3+ players need to be ready
    if (activePlayerCount >= 3) {
      return activePlayers.every(p => p.isReady || p.isHost);
    }
    
    // 2 players not allowed
    return false;
  };

  const handleStartGame = () => {
    if (activePlayerCount === 1) {
      // Show solo confirmation
      setShowSoloConfirm(true);
    } else {
      // Start normally
      onStartGame(false);
    }
  };

  const handleConfirmSolo = () => {
    setShowSoloConfirm(false);
    onStartGame(true);
  };

  const getStartHint = () => {
    if (activePlayerCount === 0) {
      return "No active players";
    } else if (activePlayerCount === 1) {
      return "Click to start solo play (stats will be tracked)";
    } else if (activePlayerCount === 2) {
      return "Need at least 3 players (or play solo)";
    } else if (activePlayerCount >= 3) {
      const notReady = activePlayers.filter(p => !p.isReady && !p.isHost);
      if (notReady.length > 0) {
        return `Waiting for ${notReady.length} player${notReady.length > 1 ? 's' : ''} to ready up`;
      }
      return "Ready to start!";
    }
    return "";
  };

  return (
    <>
      <div className={styles.lobby}>
        <header className={styles.header}>
          <h1 className={styles.title}>Game Lobby</h1>
          <p className={styles.subtitle}>
            {isHost ? 'Configure your game settings' : 'Waiting for host to start...'}
          </p>
        </header>

        <div className={styles.content}>
          <div className={styles.leftColumn}>
            <SettingsPanel
              settings={room.settings}
              onSettingsChange={onSettingsChange}
              isHost={isHost}
            />
          </div>

          <div className={styles.rightColumn}>
            <PlayerList 
              players={room.players}
              currentPlayerId={currentPlayerId}
            />

            <div className={styles.actions}>
              {!isHost && (
                <>
                  <Button
                    variant={isReady ? 'secondary' : 'primary'}
                    fullWidth
                    onClick={onToggleReady}
                    disabled={isAFK}
                  >
                    {isReady ? 'Not Ready' : 'Ready'}
                  </Button>

                  <Button
                    variant={isAFK ? 'secondary' : 'ghost'}
                    fullWidth
                    onClick={onToggleAFK}
                  >
                    {isAFK ? 'Return from AFK' : 'Go AFK'}
                  </Button>
                </>
              )}

              {isHost && (
                <>
                  <Button
                    variant="primary"
                    size="large"
                    fullWidth
                    onClick={handleStartGame}
                    disabled={!canStartGame()}
                  >
                    Start Game
                  </Button>
                  <p className={styles.startHint}>
                    {getStartHint()}
                  </p>
                </>
              )}

              <Button
                variant="danger"
                fullWidth
                onClick={onLeaveGame}
              >
                Leave Game
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Solo Play Confirmation Modal */}
      <Modal
        isOpen={showSoloConfirm}
        onClose={() => setShowSoloConfirm(false)}
        title="Solo Play"
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            You're about to start a solo game. This is great for practice!
          </p>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
              <strong>Solo Mode:</strong>
            </p>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
              <li>Voting will be disabled</li>
              <li>Your stats will still be tracked</li>
              <li>Perfect for testing and practice</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button
              variant="primary"
              fullWidth
              onClick={handleConfirmSolo}
            >
              Start Solo Game
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setShowSoloConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}