import { Volume2 } from 'lucide-react';
import type { Verse, PlaylistItem as PlaylistItemType } from '../../types';
import { RepeatCounter } from './RepeatCounter';
import { formatTime } from '../../utils/formatTime';
import styles from './PlaylistItem.module.css';

interface Props {
  item: PlaylistItemType;
  verse: Verse;
  index: number;
  isCurrent: boolean;
  onToggleEnabled: () => void;
  onRepeatChange: (count: number) => void;
  onJump: () => void;
}

export function PlaylistItem({ item, verse, index, isCurrent, onToggleEnabled, onRepeatChange, onJump }: Props) {
  return (
    <div className={styles.item}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={item.enabled}
        onChange={onToggleEnabled}
        aria-label={`${verse.reference} 활성화`}
      />
      <div
        className={`${styles.index} ${isCurrent ? styles.indexPlaying : ''}`}
        onClick={onJump}
        style={{ cursor: 'pointer' }}
      >
        {isCurrent ? <Volume2 size={18} /> : index + 1}
      </div>
      <div className={styles.info} onClick={onJump} style={{ cursor: 'pointer' }}>
        <div className={styles.name}>{verse.reference}</div>
        <div className={styles.duration}>{formatTime(verse.duration)}</div>
      </div>
      <div className={styles.repeat}>
        <RepeatCounter label="반복" count={item.repeatCount} onChange={onRepeatChange} />
      </div>
    </div>
  );
}
