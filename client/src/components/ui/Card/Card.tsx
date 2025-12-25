import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Card({ 
  selected = false, 
  onClick, 
  disabled = false, 
  children,
  className = ''
}: CardProps) {
  const classNames = [
    styles.card,
    selected && styles.selected,
    disabled && styles.disabled,
    onClick && !disabled && styles.clickable,
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={classNames}
      onClick={!disabled ? onClick : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
    >
      {children}
    </div>
  );
}