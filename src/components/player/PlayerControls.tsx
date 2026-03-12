import { Play, Pause, Repeat, Repeat1 } from 'lucide-react';
import type { RepeatMode } from '../../types';
import styles from './PlayerControls.module.css';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

interface Props {
  isPlaying: boolean;
  repeatMode: RepeatMode;
  speed: number;
  onTogglePlay: () => void;
  onCycleRepeat: () => void;
  onSpeedChange: (speed: number) => void;
}

const REPEAT_LABELS: Record<RepeatMode, string> = {
  off: '반복 끄기',
  all: '전체 반복',
  one: '한 곡 반복',
};

export function PlayerControls({ isPlaying, repeatMode, speed, onTogglePlay, onCycleRepeat, onSpeedChange }: Props) {
  const cycleSpeed = () => {
    const currentIdx = SPEEDS.indexOf(speed);
    const nextIdx = (currentIdx + 1) % SPEEDS.length;
    onSpeedChange(SPEEDS[nextIdx]);
  };
  return (
    <div className={styles.controls}>
      <button
        className={`${styles.sideButton} ${repeatMode !== 'off' ? styles.sideButtonActive : ''}`}
        onClick={onCycleRepeat}
        aria-label={REPEAT_LABELS[repeatMode]}
        title={REPEAT_LABELS[repeatMode]}
      >
        {repeatMode === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
      </button>
      <button
        className={styles.playButton}
        onClick={onTogglePlay}
        aria-label={isPlaying ? '일시정지' : '재생'}
      >
        {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
      </button>
      <button
        className={styles.speedBadge}
        onClick={cycleSpeed}
        aria-label={`재생 속도 ${speed}x`}
        title={`재생 속도 ${speed}x (클릭하여 변경)`}
      >
        {speed}x
      </button>
    </div>
  );
}
