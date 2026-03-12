import styles from './RepeatCounter.module.css';

interface Props {
  label?: string;
  count: number;
  onChange: (count: number) => void;
  min?: number;
  max?: number;
}

export function RepeatCounter({ label, count, onChange, min = 1, max = 99 }: Props) {
  return (
    <div className={styles.container}>
      {label && <span className={styles.label}>{label}</span>}
      <button
        className={styles.button}
        onClick={() => onChange(Math.max(min, count - 1))}
        aria-label="감소"
      >
        −
      </button>
      <span className={styles.count}>{count}</span>
      <button
        className={styles.button}
        onClick={() => onChange(Math.min(max, count + 1))}
        aria-label="증가"
      >
        +
      </button>
    </div>
  );
}
