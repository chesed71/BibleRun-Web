import { RepeatCounter } from './RepeatCounter';
import styles from './PlaylistHeader.module.css';

interface Props {
  globalRepeatCount: number;
  allEnabled: boolean;
  someEnabled: boolean;
  onGlobalRepeatChange: (count: number) => void;
  onToggleAll: (enabled: boolean) => void;
  onResetAllRepeat: () => void;
}

export function PlaylistHeader({ globalRepeatCount, allEnabled, someEnabled, onGlobalRepeatChange, onToggleAll, onResetAllRepeat }: Props) {
  return (
    <div className={styles.header}>
      <div className={styles.titleRow}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={allEnabled}
          ref={(el) => {
            if (el) el.indeterminate = someEnabled && !allEnabled;
          }}
          onChange={() => onToggleAll(!allEnabled)}
          aria-label="전체 선택"
        />
        <h2 className={styles.title}>재생 목록</h2>
      </div>
      <div className={styles.controls}>
        <button className={styles.resetButton} onClick={onResetAllRepeat}>반복 초기화</button>
        <RepeatCounter label="전체 반복" count={globalRepeatCount} onChange={onGlobalRepeatChange} />
      </div>
    </div>
  );
}
