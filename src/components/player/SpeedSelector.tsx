import styles from './SpeedSelector.module.css';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

interface Props {
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export function SpeedSelector({ speed, onSpeedChange }: Props) {
  return (
    <div className={styles.container}>
      <span className={styles.label}>재생 속도</span>
      {SPEEDS.map((s) => (
        <button
          key={s}
          className={`${styles.button} ${s === speed ? styles.buttonActive : ''}`}
          onClick={() => onSpeedChange(s)}
          aria-label={`재생 속도 ${s}배`}
        >
          {s}x
        </button>
      ))}
    </div>
  );
}
