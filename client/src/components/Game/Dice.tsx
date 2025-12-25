import React, { useState, useEffect } from 'react';
import styles from './Dice.module.css';

interface DiceProps {
  onRollClick: () => void;
  disabled?: boolean;
  lastRoll?: number;
}

export function Dice({ onRollClick, disabled = false, lastRoll }: DiceProps) {
  const [rolling, setRolling] = useState(false);
  const [value, setValue] = useState<number>(1);

  // Animate when we receive a roll result from server
  useEffect(() => {
    if (lastRoll) {
      setRolling(true);

      // Animate dice rolling
      let rolls = 0;
      const maxRolls = 15;
      const interval = setInterval(() => {
        setValue(Math.floor(Math.random() * 6) + 1);
        rolls++;

        if (rolls >= maxRolls) {
          clearInterval(interval);
          // Show the actual server result
          setValue(lastRoll);
          setRolling(false);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [lastRoll]);

  const handleClick = () => {
    if (disabled || rolling) return;
    onRollClick(); // Just notify parent, don't generate value
  };

  return (
    <div className={styles.diceContainer}>
      <div
        className={`${styles.dice} ${rolling ? styles.rolling : ''}`}
        onClick={handleClick}
      >
        <div className={styles.diceFace}>
          {renderDots(value)}
        </div>
      </div>
      {!disabled && !rolling && (
        <div className={styles.rollHint}>Click to roll!</div>
      )}
    </div>
  );
}

function renderDots(value: number) {
  const dots: React.ReactNode[] = [];

  // Dot positions for each face
  const patterns: Record<number, number[]> = {
    1: [4], // Center
    2: [0, 8], // Top-left, bottom-right
    3: [0, 4, 8], // Diagonal
    4: [0, 2, 6, 8], // Corners
    5: [0, 2, 4, 6, 8], // Corners + center
    6: [0, 2, 3, 5, 6, 8], // Two columns
  };

  const positions = patterns[value] || [];

  for (let i = 0; i < 9; i++) {
    dots.push(
      <div
        key={i}
        className={`${styles.dot} ${positions.includes(i) ? styles.active : ''}`}
      />
    );
  }

  return dots;
}