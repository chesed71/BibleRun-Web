import { useCallback, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { VerseDisplay } from '../components/player/VerseDisplay';
import { ProgressBar } from '../components/player/ProgressBar';
import { PlayerControls } from '../components/player/PlayerControls';
import { Playlist } from '../components/playlist/Playlist';
import versesData from '../data/verses.json';
import type { Verse } from '../types';
import styles from './HomePage.module.css';

const allVerses: Verse[] = versesData as Verse[];

export function HomePage() {
  const { state, dispatch } = usePlayer();

  const currentPlaylistItem = state.playlist[state.currentIndex];
  const currentVerse = currentPlaylistItem
    ? allVerses.find((v) => v.id === currentPlaylistItem.verseId) ?? null
    : null;

  const nextPlaylistItem = state.playlist[state.currentIndex + 1];
  const nextVerse = nextPlaylistItem
    ? allVerses.find((v) => v.id === nextPlaylistItem.verseId) ?? null
    : null;

  const getAudioSrc = (verse: Verse | null) => {
    if (!verse) return null;
    return state.mode === 'practice' ? verse.practiceAudioFile : verse.audioFile;
  };

  const onEnded = useCallback(() => {
    dispatch({ type: 'ADVANCE_TO_NEXT' });
  }, [dispatch]);

  const { currentTime, duration, play, pause, seek } = useAudioPlayer({
    src: getAudioSrc(currentVerse),
    nextSrc: getAudioSrc(nextVerse),
    speed: state.speed,
    onEnded,
  });

  useEffect(() => {
    if (state.isPlaying && currentVerse) {
      play();
    } else {
      pause();
    }
  }, [state.isPlaying, currentVerse, state.currentIndex, state.currentRepeatIteration, play, pause]);

  // Media Session API
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentVerse) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentVerse.reference,
      artist: 'BibleRun',
      album: currentVerse.book,
    });

    navigator.mediaSession.setActionHandler('play', () => dispatch({ type: 'PLAY' }));
    navigator.mediaSession.setActionHandler('pause', () => dispatch({ type: 'PAUSE' }));
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      const prevIndex = Math.max(0, state.currentIndex - 1);
      dispatch({ type: 'JUMP_TO_VERSE', index: prevIndex });
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      dispatch({ type: 'ADVANCE_TO_NEXT' });
    });
  }, [currentVerse, state.currentIndex, dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_PLAY' });
      } else if (e.code === 'ArrowLeft') {
        seek(Math.max(0, currentTime - 5));
      } else if (e.code === 'ArrowRight') {
        seek(Math.min(duration, currentTime + 5));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, seek, currentTime, duration]);

  return (
    <>
      <div className={styles.modeTabs}>
        <button
          className={`${styles.modeTab} ${state.mode === 'listen' ? styles.modeTabActive : ''}`}
          onClick={() => dispatch({ type: 'SET_MODE', mode: 'listen' })}
        >
          듣기 모드
          <span className={styles.tooltip}>구절을 순서대로 들어요</span>
        </button>
        <button
          className={`${styles.modeTab} ${state.mode === 'practice' ? styles.modeTabActive : ''}`}
          onClick={() => dispatch({ type: 'SET_MODE', mode: 'practice' })}
        >
          연습 모드
          <span className={styles.tooltip}>듣고 → 쉬고 → 따라 읽어요</span>
        </button>
      </div>
      <VerseDisplay verse={currentVerse} />
      <ProgressBar currentTime={currentTime} duration={duration} onSeek={seek} />
      <PlayerControls
        isPlaying={state.isPlaying}
        repeatMode={state.repeatMode}
        speed={state.speed}
        onTogglePlay={() => dispatch({ type: 'TOGGLE_PLAY' })}
        onCycleRepeat={() => dispatch({ type: 'CYCLE_REPEAT_MODE' })}
        onSpeedChange={(speed) => dispatch({ type: 'SET_SPEED', speed })}
      />
      <Playlist
        playlist={state.playlist}
        verses={allVerses}
        currentIndex={state.currentIndex}
        onToggleEnabled={(verseId) => dispatch({ type: 'TOGGLE_VERSE_ENABLED', verseId })}
        onToggleAll={(enabled) => dispatch({ type: 'SET_ALL_ENABLED', enabled })}
        onResetAllRepeat={() => dispatch({ type: 'RESET_ALL_REPEAT' })}
        onRepeatChange={(verseId, count) => dispatch({ type: 'SET_VERSE_REPEAT', verseId, count })}
        onJump={(index) => dispatch({ type: 'JUMP_TO_VERSE', index })}
      />
    </>
  );
}
