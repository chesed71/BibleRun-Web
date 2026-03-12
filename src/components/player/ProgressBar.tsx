import { useMemo } from 'react';
import { formatTime } from '../../utils/formatTime';
import styles from './ProgressBar.module.css';

interface Props {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export function ProgressBar({ currentTime, duration, onSeek }: Props) {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const sliderStyle = useMemo(
    () => ({
      background: `linear-gradient(to right, var(--color-primary) ${progressPercent}%, var(--color-border) ${progressPercent}%)`,
    }),
    [progressPercent],
  );

  return (
    <div className={styles.container}>
      <input
        type="range"
        className={styles.slider}
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
        style={sliderStyle}
        aria-label="재생 진행률"
      />
      <div className={styles.times}>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
