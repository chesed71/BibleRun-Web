import { useState } from 'react';
import { X } from 'lucide-react';
import type { Verse } from '../../types';
import styles from './AddVerseModal.module.css';

interface Props {
  verses: Verse[];
  addedVerseIds: Set<number>;
  onAdd: (verseId: number) => void;
  onClose: () => void;
}

export function AddVerseModal({ verses, addedVerseIds, onAdd, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filtered = verses.filter(
    (v) =>
      v.reference.includes(search) ||
      v.book.includes(search) ||
      v.text.includes(search),
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>구절 추가</h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="구절 검색 (예: 로마서, 시편)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className={styles.list}>
          {filtered.map((verse) => {
            const isAdded = addedVerseIds.has(verse.id);
            return (
              <div key={verse.id} className={styles.verseItem}>
                <div className={styles.verseInfo}>
                  <div className={styles.verseName}>{verse.reference}</div>
                  <div className={styles.versePreview}>{verse.text}</div>
                </div>
                <button
                  className={`${styles.addBtn} ${isAdded ? styles.addBtnDisabled : ''}`}
                  onClick={() => !isAdded && onAdd(verse.id)}
                  disabled={isAdded}
                >
                  {isAdded ? '추가됨' : '추가'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
