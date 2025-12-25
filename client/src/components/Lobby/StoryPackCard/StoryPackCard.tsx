import React from 'react';
import { Card } from '../../ui/Card/Card';
import styles from './StoryPackCard.module.css';

interface StoryPack {
  id: string;
  name: string;
  description: string;
  theme: string;
  color: string;
  icon: string;
  isDefault: boolean;
  price: number;
}

interface StoryPackCardProps {
  pack: StoryPack;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function StoryPackCard({ pack, selected, onSelect, disabled = false }: StoryPackCardProps) {
  return (
    <Card 
      selected={selected}
      onClick={onSelect}
      disabled={disabled}
      className={styles.packCard}
    >
      <div className={styles.icon} style={{ backgroundColor: pack.color }}>
        {pack.icon}
      </div>
      <h3 className={styles.name}>{pack.name}</h3>
      <p className={styles.description}>{pack.description}</p>
      {!pack.isDefault && (
        <div className={styles.price}>${pack.price}</div>
      )}
    </Card>
  );
}