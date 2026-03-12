import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Verse, PlaylistItem as PlaylistItemType } from '../../types';
import { PlaylistHeader } from './PlaylistHeader';
import { PlaylistItem } from './PlaylistItem';
import styles from './Playlist.module.css';

const PAGE_SIZE = 10;

interface Props {
  playlist: PlaylistItemType[];
  verses: Verse[];
  currentIndex: number;
  globalRepeatCount: number;
  onToggleEnabled: (verseId: number) => void;
  onToggleAll: (enabled: boolean) => void;
  onResetAllRepeat: () => void;
  onRepeatChange: (verseId: number, count: number) => void;
  onGlobalRepeatChange: (count: number) => void;
  onJump: (index: number) => void;
}

export function Playlist({
  playlist,
  verses,
  currentIndex,
  globalRepeatCount,
  onToggleEnabled,
  onToggleAll,
  onResetAllRepeat,
  onRepeatChange,
  onGlobalRepeatChange,
  onJump,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(playlist.length / PAGE_SIZE));
  const [page, setPage] = useState(0);

  // 현재 재생 중인 구절이 있는 페이지로 자동 이동
  useEffect(() => {
    if (playlist.length > 0) {
      const targetPage = Math.floor(currentIndex / PAGE_SIZE);
      setPage(targetPage);
    }
  }, [currentIndex, playlist.length]);

  const start = page * PAGE_SIZE;
  const pageItems = playlist.slice(start, start + PAGE_SIZE);

  const getVerse = (verseId: number) => verses.find((v) => v.id === verseId);

  return (
    <div>
      <PlaylistHeader
        globalRepeatCount={globalRepeatCount}
        allEnabled={playlist.length > 0 && playlist.every((item) => item.enabled)}
        someEnabled={playlist.some((item) => item.enabled)}
        onGlobalRepeatChange={onGlobalRepeatChange}
        onToggleAll={onToggleAll}
        onResetAllRepeat={onResetAllRepeat}
      />
      {playlist.length === 0 ? (
        <p className={styles.empty}>재생목록이 비어있어요. 아래 버튼으로 구절을 추가해보세요.</p>
      ) : (
        <>
          {pageItems.map((item, idx) => {
            const verse = getVerse(item.verseId);
            if (!verse) return null;
            const globalIdx = start + idx;
            return (
              <PlaylistItem
                key={item.verseId}
                item={item}
                verse={verse}
                index={globalIdx}
                isCurrent={globalIdx === currentIndex}
                onToggleEnabled={() => onToggleEnabled(item.verseId)}
                onRepeatChange={(count) => onRepeatChange(item.verseId, count)}
                onJump={() => onJump(globalIdx)}
              />
            );
          })}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={`${styles.pageArrow} ${page === 0 ? styles.pageArrowDisabled : ''}`}
                onClick={() => setPage(page - 1)}
                aria-label="이전 페이지"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`${styles.pageButton} ${i === page ? styles.pageButtonActive : ''}`}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className={`${styles.pageArrow} ${page === totalPages - 1 ? styles.pageArrowDisabled : ''}`}
                onClick={() => setPage(page + 1)}
                aria-label="다음 페이지"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
{/* <button className={styles.addButton} onClick={onAddClick}>
        <Plus size={18} />
        구절 추가하기
      </button> */}
    </div>
  );
}
