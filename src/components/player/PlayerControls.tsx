import { Play, Pause, Repeat, Repeat1, Mic, Square, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { RepeatMode, PlayMode } from '../../types';
import styles from './PlayerControls.module.css';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

interface Props {
  isPlaying: boolean;
  repeatMode: RepeatMode;
  speed: number;
  mode: PlayMode;
  isRecording?: boolean;
  onTogglePlay: () => void;
  onCycleRepeat: () => void;
  onSpeedChange: (speed: number) => void;
  onToggleRecording?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onPrevMany?: () => void;
  onNextMany?: () => void;
}

const REPEAT_LABELS: Record<RepeatMode, string> = {
  off: '반복 끄기',
  all: '전체 반복',
  one: '한 곡 반복',
};

export function PlayerControls({
  isPlaying,
  repeatMode,
  speed,
  mode,
  isRecording = false,
  onTogglePlay,
  onCycleRepeat,
  onSpeedChange,
  onToggleRecording,
  onPrev,
  onNext,
  onPrevMany,
  onNextMany,
}: Props) {
  const cycleSpeed = () => {
    const currentIdx = SPEEDS.indexOf(speed);
    const nextIdx = (currentIdx + 1) % SPEEDS.length;
    onSpeedChange(SPEEDS[nextIdx]);
  };

  const isReciteMode = mode === 'recite';

  if (isReciteMode) {
    return (
      <div className={styles.controls}>
        <button
          className={styles.sideButton}
          onClick={onPrevMany}
          aria-label="10개 이전"
          title="10개 이전"
        >
          <ChevronsLeft size={22} />
        </button>
        <button
          className={styles.sideButton}
          onClick={onPrev}
          aria-label="이전 구절"
          title="이전 구절"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          className={`${styles.playButton} ${isRecording ? styles.recordingButton : styles.micButton}`}
          onClick={onToggleRecording}
          aria-label={isRecording ? '녹음 중지' : '녹음 시작'}
        >
          {isRecording ? <Square size={20} fill="white" /> : <Mic size={24} />}
        </button>
        <button
          className={styles.sideButton}
          onClick={onNext}
          aria-label="다음 구절"
          title="다음 구절"
        >
          <ChevronRight size={22} />
        </button>
        <button
          className={styles.sideButton}
          onClick={onNextMany}
          aria-label="10개 다음"
          title="10개 다음"
        >
          <ChevronsRight size={22} />
        </button>
      </div>
    );
  }

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
