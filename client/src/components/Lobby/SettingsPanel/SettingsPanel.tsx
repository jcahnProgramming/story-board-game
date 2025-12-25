import React from 'react';
import { GameSettings, BOARD_LENGTH_OPTIONS, TURN_TIMER_OPTIONS } from '@shared/types';
import { DEFAULT_STORY_PACKS } from '../../../data/storyPacks';
import { StoryPackCard } from '../StoryPackCard/StoryPackCard';
import { Slider } from '../../ui/Slider/Slider';
import { Toggle } from '../../ui/Toggle/Toggle';
import styles from './SettingsPanel.module.css';

interface SettingsPanelProps {
  settings: GameSettings;
  onSettingsChange: (settings: Partial<GameSettings>) => void;
  isHost: boolean;
}

export function SettingsPanel({ settings, onSettingsChange, isHost }: SettingsPanelProps) {
  return (
    <div className={styles.settingsPanel}>
      <h2 className={styles.title}>Game Settings</h2>

      {/* Story Pack Selection */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Story Pack</h3>
        <div className={styles.storyPackGrid}>
          {DEFAULT_STORY_PACKS.map((pack) => (
            <StoryPackCard
              key={pack.id}
              pack={pack}
              selected={settings.selectedStoryPack === pack.id}
              onSelect={() => isHost && onSettingsChange({ selectedStoryPack: pack.id })}
              disabled={!isHost}
            />
          ))}
        </div>
      </div>

      {/* Board Length */}
      <div className={styles.section}>
        <Slider
          label="Board Length"
          options={BOARD_LENGTH_OPTIONS}
          value={settings.boardLength}
          onChange={(value) => isHost && onSettingsChange({ boardLength: value })}
          disabled={!isHost}
        />
      </div>

      {/* Turn Timer */}
      <div className={styles.section}>
        <label className={styles.label}>Turn Timer</label>
        <select
          className={styles.select}
          value={settings.turnTimer}
          onChange={(e) => isHost && onSettingsChange({ turnTimer: parseInt(e.target.value) })}
          disabled={!isHost}
        >
          {TURN_TIMER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Max Players */}
      <div className={styles.section}>
        <label className={styles.label}>Max Players</label>
        <input
          type="number"
          min="3"
          max="10"
          className={styles.numberInput}
          value={settings.maxPlayers}
          onChange={(e) => isHost && onSettingsChange({ maxPlayers: parseInt(e.target.value) })}
          disabled={!isHost}
        />
      </div>

      {/* Voting Enabled */}
      <div className={styles.section}>
        <Toggle
          label="Enable Voting"
          checked={settings.votingEnabled}
          onChange={(checked) => isHost && onSettingsChange({ votingEnabled: checked })}
          disabled={!isHost}
        />
      </div>
    </div>
  );
}