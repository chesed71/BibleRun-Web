import { useRef } from 'react';
import type { Verse } from '../../types';
import styles from './ScriptureView.module.css';

const JUMP_WEEKS = [1, 5, 9, 13, 17, 21, 25, 29];

interface Props {
  verses: Verse[];
}

export function ScriptureView({ verses }: Props) {
  const weekRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const weeks: Verse[][] = [];
  for (let i = 0; i < verses.length; i += 2) {
    weeks.push(verses.slice(i, i + 2));
  }

  const scrollToWeek = (week: number) => {
    weekRefs.current[week - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.jumpBar}>
        {JUMP_WEEKS.map((week) => (
          <button
            key={week}
            className={styles.jumpButton}
            onClick={() => scrollToWeek(week)}
          >
            {week}주차
          </button>
        ))}
      </div>
      <div className={styles.container}>
        {weeks.map((weekVerses, weekIndex) => (
          <div
            key={weekIndex}
            className={styles.weekCard}
            ref={(el) => { weekRefs.current[weekIndex] = el; }}
          >
            <h3 className={styles.weekTitle}>{weekIndex + 1}주차</h3>
            {weekVerses.map((verse) => (
              <div key={verse.id} className={styles.verseItem}>
                <p className={styles.verseReference}>{verse.reference}</p>
                <p className={styles.verseText}>{verse.text}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
