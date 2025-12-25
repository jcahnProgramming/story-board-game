import React, { useState, useEffect } from 'react'
import { useDiscordParticipants } from '../../discord/useDiscordParticipants'
import { DiscordClient } from '../../discord/DiscordClient'
import { useGameSocket } from '../../hooks/useGameSocket'
import { useGameStore } from '../../store/gameStore'
import { Lobby } from '../Lobby/Lobby'
import { GameScreen } from '../Game/GameScreen'
import { Button } from '../ui/Button/Button'
import styles from './HomePage.module.css'

function HomePage() {
  const { participants, loading } = useDiscordParticipants()
  const instanceId = DiscordClient.getInstanceId()
  const { createRoom, joinRoom, isConnected } = useGameSocket()
  const { isInLobby, isPlaying, room, currentPlayerId, error } = useGameStore()
  
  const [playerName, setPlayerName] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebug = (msg: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])
  }

  // Debug logging
  useEffect(() => {
    addDebug(`State changed - isInLobby: ${isInLobby}, isPlaying: ${isPlaying}, hasRoom: ${!!room}, playerId: ${currentPlayerId}`)
  }, [isInLobby, isPlaying, room, currentPlayerId])

  // If playing, show game screen
  if (isPlaying && room && currentPlayerId) {
    return <GameScreen />
  }

  // If in lobby, show lobby component
  if (isInLobby && room && currentPlayerId) {
    return <LobbyContainer />
  }

  const handleCreateGame = () => {
    addDebug('Create game clicked')
    setShowNameInput(true)
    setIsCreating(true)
  }

  const handleJoinGame = () => {
    addDebug('Join game clicked')
    setShowNameInput(true)
    setIsCreating(false)
  }

  const handleSubmitName = () => {
    if (!playerName.trim() || !instanceId) {
      addDebug(`ERROR: Missing data - name: ${playerName}, instance: ${instanceId}`)
      return
    }

    addDebug(`Submitting - name: ${playerName}, instance: ${instanceId}, creating: ${isCreating}, connected: ${isConnected}`)

    if (isCreating) {
      addDebug('Calling createRoom...')
      createRoom(playerName.trim(), instanceId)
    } else {
      addDebug('Calling joinRoom...')
      joinRoom(instanceId, playerName.trim())
    }
    
    setShowNameInput(false)
    setPlayerName('')
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingText}>Loading participants...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Story Board Game</h1>
        <p className={styles.subtitle}>A multiplayer storytelling adventure</p>
      </header>

      <main className={styles.main}>
        {/* Debug Panel */}
        <div style={{ 
          background: 'rgba(0,0,0,0.5)', 
          padding: '1rem', 
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          maxHeight: '200px',
          overflowY: 'auto',
          fontSize: '0.75rem',
          fontFamily: 'monospace'
        }}>
          <div><strong>Debug Info:</strong></div>
          <div>Socket Connected: {isConnected ? '✅' : '❌'}</div>
          <div>Instance ID: {instanceId || 'NONE'}</div>
          <div>Player ID: {currentPlayerId || 'NONE'}</div>
          <div>In Lobby: {isInLobby ? 'YES' : 'NO'}</div>
          <div>Is Playing: {isPlaying ? 'YES' : 'NO'}</div>
          <div>Has Room: {room ? 'YES' : 'NO'}</div>
          {error && <div style={{ color: '#ff6b6b' }}>Error: {error}</div>}
          <hr style={{ margin: '0.5rem 0', opacity: 0.3 }} />
          {debugInfo.slice(-10).map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </div>

        <div className={styles.infoCard}>
          <h2>Voice Channel</h2>
          <p>{participants.length} participant{participants.length !== 1 ? 's' : ''} connected</p>
        </div>

        {!showNameInput ? (
          <div className={styles.actions}>
            <Button
              variant="primary"
              size="large"
              onClick={handleCreateGame}
            >
              Start New Game
            </Button>
            <Button
              variant="secondary"
              size="large"
              onClick={handleJoinGame}
            >
              Join Game
            </Button>
          </div>
        ) : (
          <div className={styles.nameInput}>
            <h3>{isCreating ? 'Create Game' : 'Join Game'}</h3>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmitName()}
              maxLength={20}
              autoFocus
              className={styles.input}
            />
            <div className={styles.inputActions}>
              <Button
                variant="primary"
                onClick={handleSubmitName}
                disabled={!playerName.trim()}
              >
                {isCreating ? 'Create' : 'Join'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  addDebug('Cancelled')
                  setShowNameInput(false)
                  setPlayerName('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function LobbyContainer() {
  const { room, currentPlayerId } = useGameStore()
  const { updateSettings, toggleReady, toggleAFK, startGame, leaveRoom } = useGameSocket()

  if (!room || !currentPlayerId) return null

  return (
    <Lobby
      room={room}
      currentPlayerId={currentPlayerId}
      onSettingsChange={updateSettings}
      onToggleReady={toggleReady}
      onToggleAFK={toggleAFK}
      onStartGame={startGame}
      onLeaveGame={leaveRoom}
    />
  )
}

export default HomePage