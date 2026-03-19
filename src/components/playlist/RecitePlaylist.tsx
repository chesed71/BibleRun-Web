import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Verse } from '../../types';
import styles from './RecitePlaylist.module.css';

interface Props {
  verses: Verse[];
  currentVerseId: number | null;
  onSelect: (verseId: number) => void;
}

export function RecitePlaylist({ verses, currentVerseId, onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentVerse = verses.find((v) => v.id === currentVerseId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      <button className={styles.selector} onClick={() => setIsOpen(!isOpen)}>
        <span className={styles.selectorText}>
          {currentVerse ? currentVerse.reference : '구절을 선택하세요'}
        </span>
        <ChevronDown size={18} className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`} />
      </button>
      {isOpen && (
        <div className={styles.dropdown}>
          {verses.map((verse) => (
            <button
              key={verse.id}
              className={`${styles.item} ${verse.id === currentVerseId ? styles.itemActive : ''}`}
              onClick={() => {
                onSelect(verse.id);
                setIsOpen(false);
              }}
            >
              {verse.reference}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
