import { useEffect, useState } from 'react'
import { DiscordClient } from './discord/DiscordClient'
import { useDiscordSDK } from './discord/useDiscordSDK'
import HomePage from './components/HomePage/HomePage'

function App() {
  const { loading, error } = useDiscordSDK()
  const [detailedError, setDetailedError] = useState<string>('')

  useEffect(() => {
    if (error) {
      setDetailedError(JSON.stringify(error, null, 2))
    }
  }, [error])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Connecting to Discord...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <h1>Failed to connect to Discord</h1>
        <p>{String(error)}</p>
        {detailedError && (
          <pre style={{ 
            background: 'rgba(0,0,0,0.5)', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            textAlign: 'left',
            overflow: 'auto',
            maxWidth: '600px',
            margin: '1rem auto'
          }}>
            {detailedError}
          </pre>
        )}
        <p style={{ marginTop: '2rem', opacity: 0.8 }}>
          Make sure you're running this as a Discord Activity
        </p>
      </div>
    )
  }

  return <HomePage />
}

export default App