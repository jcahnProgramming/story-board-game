import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useGameSocket } from '../../hooks/useGameSocket';
import { Button } from '../ui/Button/Button';
import { Dice } from './Dice';
import styles from './GameScreen.module.css';
import type { BoardSpace } from '@shared/types';

// Lazy load PixiJS components to catch import errors
let GameBoard: any = null;
let BoardGenerator: any = null;

export function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameBoardRef = useRef<any>(null);
  const { room, currentPlayerId } = useGameStore();
  const { leaveRoom, rollDice, lastDiceRoll } = useGameSocket();
  const [isOverview, setIsOverview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [pixiLoaded, setPixiLoaded] = useState(false);
  const [boardData, setBoardData] = useState<BoardSpace[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const addLog = (msg: string) => {
    console.log(msg);
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  // Load PixiJS components
  useEffect(() => {
    addLog('Loading PixiJS components...');
    
    Promise.all([
      import('../../pixi/GameBoard').then(module => {
        GameBoard = module.GameBoard;
        addLog('GameBoard class loaded');
      }),
      import('../../services/boardGenerator').then(module => {
        BoardGenerator = module.BoardGenerator;
        addLog('BoardGenerator class loaded');
      })
    ])
    .then(() => {
      addLog('All PixiJS components loaded successfully');
      setPixiLoaded(true);
    })
    .catch(err => {
      addLog(`Failed to load PixiJS: ${err.message}`);
      setError(`Failed to load game components: ${err.message}`);
    });
  }, []);

  // Initialize game board (only once)
  useEffect(() => {
    if (!pixiLoaded || !canvasRef.current || !room || !GameBoard || !BoardGenerator) {
      return;
    }

    // Only initialize if we don't have a board yet
    if (gameBoardRef.current) {
      return;
    }

    addLog('Initializing game board...');

    try {
      addLog('Creating GameBoard instance...');
      const gameBoard = new GameBoard(canvasRef.current);
      gameBoardRef.current = gameBoard;
      addLog('GameBoard created successfully');

      addLog('Generating board data...');
      const generator = new BoardGenerator(room.settings);
      const boardSpaces = generator.generateBoard();
      addLog(`Board generated: ${boardSpaces.length} spaces`);
      
      // Store board data for display
      setBoardData(boardSpaces);

      addLog('Rendering board...');
      gameBoard.generateBoard(boardSpaces);
      addLog('Board rendered successfully!');

      // Render players
      if (room.players) {
        addLog('Rendering players...');
        gameBoard.updatePlayers(room.players);
        addLog('Players rendered!');
      }

    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
      setError(err.message);
    }

    return () => {
      if (gameBoardRef.current) {
        try {
          gameBoardRef.current.destroy();
        } catch (err) {
          console.error('Cleanup error:', err);
        }
        gameBoardRef.current = null;
      }
    };
  }, [pixiLoaded]);

  // Update players when room changes
  useEffect(() => {
    if (gameBoardRef.current && room?.players) {
      addLog(`Updating ${room.players.length} player(s)...`);
      gameBoardRef.current.updatePlayers(room.players);
      
      // Follow current player if in follow mode
      if (!isOverview && currentPlayerId) {
        const currentPlayer = room.players.find(p => p.id === currentPlayerId);
        if (currentPlayer) {
          setTimeout(() => {
            gameBoardRef.current.followSpace(currentPlayer.position);
          }, 300);
        }
      }
    }
  }, [room?.players, isOverview, currentPlayerId]);

  const handleToggleOverview = () => {
    if (gameBoardRef.current) {
      gameBoardRef.current.toggleOverview();
      setIsOverview(!isOverview);
    }
  };

  if (!room || !currentPlayerId) {
    return (
      <div style={{ 
        padding: '2rem', 
        color: 'white', 
        background: '#1a1a2e',
        minHeight: '100vh'
      }}>
        <h1>Loading game...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        color: 'white', 
        background: '#1a1a2e',
        minHeight: '100vh'
      }}>
        <h1>Error loading game</h1>
        <pre style={{ 
          background: 'rgba(255,0,0,0.2)', 
          padding: '1rem', 
          borderRadius: '0.5rem'
        }}>
          {error}
        </pre>
        <Button onClick={leaveRoom}>Back to Lobby</Button>
      </div>
    );
  }

  return (
    <div className={styles.gameScreen}>
      <canvas ref={canvasRef} className={styles.canvas} />
      
      {/* UI Overlay */}
      <div className={styles.uiOverlay}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <div className={styles.gameInfo}>
            <h2>{room.settings.selectedStoryPack}</h2>
            <p>Players: {room.players.length}</p>
          </div>
          
          <div className={styles.controls}>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? '🐛 Hide Debug' : '🐛 Debug View'}
            </Button>
            
            <Button
              variant="secondary"
              size="small"
              onClick={handleToggleOverview}
              disabled={!pixiLoaded}
            >
              {isOverview ? '🔍 Follow' : '🗺️ Overview'}
            </Button>
            
            <Button
              variant="danger"
              size="small"
              onClick={leaveRoom}
            >
              Leave Game
            </Button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.turnInfo}>
            <p>Turn: {room.players[0]?.name || 'Unknown'}</p>
            <p>Time: {room.settings.turnTimer}s</p>
          </div>
          
          <Dice
            onRollClick={rollDice}
            disabled={false}
            lastRoll={lastDiceRoll || undefined}
          />
        </div>

        {/* Unified Debug Panel - Right Side */}
        {showDebug && (
          <div style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.9)',
            padding: '1rem',
            borderRadius: '0.5rem',
            maxHeight: '80vh',
            overflowY: 'auto',
            width: '450px',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {/* Log Section */}
            <div>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '0.5rem', 
                fontSize: '0.9rem',
                borderBottom: '1px solid rgba(255,255,255,0.2)',
                paddingBottom: '0.25rem'
              }}>
                Event Log
              </div>
              <div style={{ 
                maxHeight: '150px', 
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.3)',
                padding: '0.5rem',
                borderRadius: '0.25rem'
              }}>
                {debugLog.slice(-10).map((log, i) => (
                  <div key={i} style={{ marginBottom: '0.25rem' }}>{log}</div>
                ))}
              </div>
            </div>

            {/* Board Structure Section */}
            <div>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '0.5rem', 
                fontSize: '0.9rem',
                borderBottom: '1px solid rgba(255,255,255,0.2)',
                paddingBottom: '0.25rem'
              }}>
                Board Structure ({boardData.length} spaces)
              </div>
              <div style={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.3)',
                padding: '0.5rem',
                borderRadius: '0.25rem'
              }}>
                {boardData.map((space, idx) => {
                  const branchInfo = space.branchId 
                    ? ` [ID:${space.branchId}, idx:${space.branchIndex}]` 
                    : '';
                  const branchCount = space.branchCount ? ` (${space.branchCount} paths)` : '';
                  
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        padding: '0.25rem',
                        marginBottom: '0.125rem',
                        background: space.type.includes('branch') ? 'rgba(255,100,100,0.2)' : 'transparent',
                        borderRadius: '0.125rem'
                      }}
                    >
                      {idx}: pos={space.position}, type={space.type}{branchInfo}{branchCount}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}