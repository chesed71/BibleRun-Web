import { useCallback, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { VerseDisplay } from '../components/player/VerseDisplay';
import { ProgressBar } from '../components/player/ProgressBar';
import { PlayerControls } from '../components/player/PlayerControls';
import { RecitationResult } from '../components/player/RecitationResult';
import { Playlist } from '../components/playlist/Playlist';
import { RecitePlaylist } from '../components/playlist/RecitePlaylist';
import versesData from '../data/verses.json';
import type { Verse, PlayMode } from '../types';
import styles from './HomePage.module.css';

const allVerses: Verse[] = versesData as Verse[];

const MODE_CONFIG: Array<{ mode: PlayMode; label: string; tooltip: string }> = [
  { mode: 'listen', label: '듣기', tooltip: '구절을 순서대로 들어요' },
  { mode: 'recite', label: '암송', tooltip: '구절을 보지 않고 암송해요' },
  { mode: 'check', label: '확인', tooltip: '듣고 → 쉬고 → 따라 읽어요' },
];

export function HomePage() {
  const { state, dispatch } = usePlayer();
  const { status, result, error, isSupported, startRecording, stopRecording, reset } =
    useSpeechRecognition();

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
    if (state.mode === 'recite') return null;
    return state.mode === 'check' ? verse.practiceAudioFile : verse.audioFile;
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
    if (state.mode === 'recite') return;
    if (state.isPlaying && currentVerse) {
      play();
    } else {
      pause();
    }
  }, [state.isPlaying, state.mode, currentVerse, state.currentIndex, state.currentRepeatIteration, play, pause]);

  // Reset recitation when switching verses or modes
  useEffect(() => {
    reset();
  }, [state.currentIndex, state.mode, reset]);

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
      if (state.mode === 'recite') return;
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
  }, [dispatch, seek, currentTime, duration, state.mode]);

  const handleToggleRecording = () => {
    if (!currentVerse) return;
    if (status === 'recording') {
      stopRecording();
    } else {
      startRecording(currentVerse.text);
    }
  };

  const handlePrev = () => {
    const prevIndex = Math.max(0, state.currentIndex - 1);
    dispatch({ type: 'JUMP_TO_VERSE', index: prevIndex });
  };

  const handleNext = () => {
    dispatch({ type: 'ADVANCE_TO_NEXT' });
  };

  const handlePrevMany = () => {
    const prevIndex = Math.max(0, state.currentIndex - 10);
    dispatch({ type: 'JUMP_TO_VERSE', index: prevIndex });
  };

  const handleNextMany = () => {
    const lastIndex = state.playlist.length - 1;
    const nextIndex = Math.min(lastIndex, state.currentIndex + 10);
    dispatch({ type: 'JUMP_TO_VERSE', index: nextIndex });
  };

  const handleSelectVerse = (verseId: number) => {
    const index = state.playlist.findIndex((item) => item.verseId === verseId);
    if (index !== -1) {
      dispatch({ type: 'JUMP_TO_VERSE', index });
    }
  };

  const isReciteMode = state.mode === 'recite';
  const showResult = isReciteMode && status === 'done' && result;

  return (
    <>
      <div className={styles.modeTabs}>
        {MODE_CONFIG.map(({ mode, label, tooltip }) => (
          <button
            key={mode}
            className={`${styles.modeTab} ${state.mode === mode ? styles.modeTabActive : ''}`}
            onClick={() => dispatch({ type: 'SET_MODE', mode })}
          >
            {label}
            <span className={styles.tooltip}>{tooltip}</span>
          </button>
        ))}
      </div>

      {isReciteMode ? (
        <>
          <p className={styles.reciteDisclaimer}>음성 녹음 인식률이 별로 좋지 않습니다. 이해부탁드립니다.</p>
          {status === 'idle' && currentVerse && (
            <div className={styles.reciteReference}>
              <p className={styles.reciteReferenceText}>{state.currentIndex + 1}. {currentVerse.reference}</p>
              <p className={styles.reciteHint}>마이크 버튼을 눌러 암송을 시작하세요</p>
            </div>
          )}

          {status === 'recording' && (
            <div className={styles.recordingStatus}>
              <span className={styles.recordingDot} />
              녹음 중... 구절을 암송해주세요
            </div>
          )}

          {status === 'processing' && (
            <div className={styles.recordingStatus}>분석 중...</div>
          )}

          {error && (
            <div className={styles.errorMessage}>{error}</div>
          )}

          {showResult && currentVerse && (
            <RecitationResult
              result={result}
              reference={currentVerse.reference}
              onRetry={reset}
              onNext={handleNext}
            />
          )}

          {!isSupported && (
            <div className={styles.errorMessage}>
              이 브라우저에서는 음성 인식을 지원하지 않아요. Chrome을 사용해주세요.
            </div>
          )}

          {status !== 'done' && (
            <PlayerControls
              isPlaying={state.isPlaying}
              repeatMode={state.repeatMode}
              speed={state.speed}
              mode={state.mode}
              isRecording={status === 'recording'}
              onTogglePlay={() => dispatch({ type: 'TOGGLE_PLAY' })}
              onCycleRepeat={() => dispatch({ type: 'CYCLE_REPEAT_MODE' })}
              onSpeedChange={(speed) => dispatch({ type: 'SET_SPEED', speed })}
              onToggleRecording={handleToggleRecording}
              onPrev={handlePrev}
              onNext={handleNext}
              onPrevMany={handlePrevMany}
              onNextMany={handleNextMany}
            />
          )}

          <RecitePlaylist
            verses={allVerses}
            currentVerseId={currentVerse?.id ?? null}
            onSelect={handleSelectVerse}
          />
        </>
      ) : (
        <>
          <VerseDisplay verse={currentVerse} />
          <ProgressBar currentTime={currentTime} duration={duration} onSeek={seek} />
          <PlayerControls
            isPlaying={state.isPlaying}
            repeatMode={state.repeatMode}
            speed={state.speed}
            mode={state.mode}
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
      )}
    </>
  );
}
