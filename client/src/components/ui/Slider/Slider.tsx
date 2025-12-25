import React from 'react';
import styles from './Slider.module.css';

interface SliderOption {
  label: string;
  value: number;
}

interface SliderProps {
  options: SliderOption[];
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
}

export function Slider({ options, value, onChange, disabled = false, label }: SliderProps) {
  const currentIndex = options.findIndex(opt => opt.value === value);
  const percentage = (currentIndex / (options.length - 1)) * 100;

  return (
    <div className={`${styles.sliderContainer} ${disabled ? styles.disabled : ''}`}>
      {label && <label className={styles.label}>{label}</label>}
      
      <div className={styles.slider}>
        <input
          type="range"
          min="0"
          max={options.length - 1}
          value={currentIndex}
          onChange={(e) => onChange(options[parseInt(e.target.value)].value)}
          disabled={disabled}
          className={styles.input}
          style={{
            background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${percentage}%, rgba(255,255,255,0.2) ${percentage}%, rgba(255,255,255,0.2) 100%)`
          }}
        />
        
        <div className={styles.ticks}>
          {options.map((option, index) => (
            <div 
              key={option.value}
              className={`${styles.tick} ${index === currentIndex ? styles.active : ''}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.labels}>
        {options.map((option, index) => (
          <span 
            key={option.value}
            className={`${styles.optionLabel} ${index === currentIndex ? styles.activeLabel : ''}`}
          >
            {option.label}
          </span>
        ))}
      </div>
    </div>
  );
}