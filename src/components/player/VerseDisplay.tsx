import type { Verse } from '../../types';
import styles from './VerseDisplay.module.css';

interface Props {
  verse: Verse | null;
}

export function VerseDisplay({ verse }: Props) {
  if (!verse) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>재생목록에 구절을 추가해주세요</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.reference}>{verse.displayNameEn}</p>
      <p className={styles.text}>{verse.text}</p>
    </div>
  );
}
