import React from 'react'
import { useDiscordSDK } from './discord/useDiscordSDK'
import HomePage from './components/HomePage/HomePage'
import styles from './App.module.css'

function App() {
  const { sdk, loading, error, isDiscord } = useDiscordSDK()

  if (loading) {
    return (
      <div className={styles.app}>
        <div className={styles.loading}>
          <h2>Connecting to Discord...</h2>
          <div className={styles.spinner}></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.app}>
        <div className={styles.error}>
          <h2>Failed to connect to Discord</h2>
          <p>{error.message}</p>
          <p className={styles.hint}>
            Make sure you're running this as a Discord Activity
          </p>
        </div>
      </div>
    )
  }

  if (!isDiscord) {
    return (
      <div className={styles.app}>
        <div className={styles.error}>
          <h2>Not running in Discord</h2>
          <p>This app must be launched as a Discord Activity</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.app}>
      <HomePage />
    </div>
  )
}

export default App