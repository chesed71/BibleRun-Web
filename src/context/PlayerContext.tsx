import { createContext, useContext, useReducer, useEffect, type ReactNode, type Dispatch } from 'react';
import type { PlayerState, PlaylistItem, PlayMode, Verse } from '../types';
import versesData from '../data/verses.json';

const STORAGE_KEY = 'biblerun-playlist';
const MODE_STORAGE_KEY = 'biblerun-mode';
const allVerses: Verse[] = versesData as Verse[];

export type PlayerAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SEEK'; position: number }
  | { type: 'SET_SPEED'; speed: number }
  | { type: 'CYCLE_REPEAT_MODE' }
  | { type: 'ADD_VERSE'; verseId: number }
  | { type: 'REMOVE_VERSE'; verseId: number }
  | { type: 'TOGGLE_VERSE_ENABLED'; verseId: number }
  | { type: 'SET_ALL_ENABLED'; enabled: boolean }
  | { type: 'SET_VERSE_REPEAT'; verseId: number; count: number }
  | { type: 'RESET_ALL_REPEAT' }
  | { type: 'ADVANCE_TO_NEXT' }
  | { type: 'JUMP_TO_VERSE'; index: number }
  | { type: 'SET_MODE'; mode: PlayMode };

function makeDefaultPlaylist(): PlaylistItem[] {
  return allVerses.map((v, i) => ({
    verseId: v.id,
    enabled: true,
    repeatCount: 1,
    order: i,
  }));
}

function getInitialPlaylist(): PlaylistItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return makeDefaultPlaylist();
}

function getInitialMode(): PlayMode {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === 'listen' || stored === 'practice') return stored;
  } catch { /* ignore */ }
  return 'listen';
}

export const initialState: PlayerState = {
  playlist: getInitialPlaylist(),
  isPlaying: false,
  currentIndex: 0,
  currentRepeatIteration: 0,
  infiniteLoop: false,
  repeatMode: 'off' as const,
  speed: 1,
  mode: getInitialMode(),
};

function findNextEnabledIndex(playlist: PlaylistItem[], fromIndex: number): number {
  for (let i = fromIndex; i < playlist.length; i++) {
    if (playlist[i].enabled) return i;
  }
  return -1;
}

function findFirstEnabledIndex(playlist: PlaylistItem[]): number {
  return playlist.findIndex((item) => item.enabled);
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'PLAY':
      return { ...state, isPlaying: true };

    case 'PAUSE':
      return { ...state, isPlaying: false };

    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };

    case 'SEEK':
      return state;

    case 'SET_SPEED':
      return { ...state, speed: action.speed };

    case 'CYCLE_REPEAT_MODE': {
      const next = state.repeatMode === 'off' ? 'all' : state.repeatMode === 'all' ? 'one' : 'off';
      return { ...state, repeatMode: next, infiniteLoop: next === 'all' };
    }

    case 'ADD_VERSE': {
      if (state.playlist.some((item) => item.verseId === action.verseId)) return state;
      const newItem: PlaylistItem = {
        verseId: action.verseId,
        enabled: true,
        repeatCount: 1,
        order: state.playlist.length,
      };
      return { ...state, playlist: [...state.playlist, newItem] };
    }

    case 'REMOVE_VERSE': {
      const filtered = state.playlist
        .filter((item) => item.verseId !== action.verseId)
        .map((item, idx) => ({ ...item, order: idx }));
      let newIndex = state.currentIndex;
      if (newIndex >= filtered.length) newIndex = Math.max(0, filtered.length - 1);
      return { ...state, playlist: filtered, currentIndex: newIndex, currentRepeatIteration: 0 };
    }

    case 'TOGGLE_VERSE_ENABLED': {
      const playlist = state.playlist.map((item) =>
        item.verseId === action.verseId ? { ...item, enabled: !item.enabled } : item,
      );
      let newIndex = state.currentIndex;
      if (!playlist[newIndex]?.enabled) {
        const first = findFirstEnabledIndex(playlist);
        newIndex = first !== -1 ? first : state.currentIndex;
      }
      return { ...state, playlist, currentIndex: newIndex, currentRepeatIteration: 0 };
    }

    case 'SET_ALL_ENABLED': {
      const playlist = state.playlist.map((item) => ({ ...item, enabled: action.enabled }));
      const newIndex = action.enabled ? state.currentIndex : 0;
      return { ...state, playlist, currentIndex: newIndex, currentRepeatIteration: 0 };
    }

    case 'SET_VERSE_REPEAT': {
      const playlist = state.playlist.map((item) =>
        item.verseId === action.verseId ? { ...item, repeatCount: Math.max(1, action.count) } : item,
      );
      return { ...state, playlist };
    }

    case 'RESET_ALL_REPEAT': {
      const playlist = state.playlist.map((item) => ({ ...item, repeatCount: 1 }));
      return { ...state, playlist, currentRepeatIteration: 0 };
    }

    case 'ADVANCE_TO_NEXT': {
      const { playlist, currentIndex, currentRepeatIteration, infiniteLoop, repeatMode } = state;
      if (playlist.length === 0) return { ...state, isPlaying: false };

      const currentItem = playlist[currentIndex];
      if (!currentItem) return { ...state, isPlaying: false };

      // 한 곡 반복 모드: 항상 같은 구절 처음부터 재생
      if (repeatMode === 'one') {
        return { ...state, currentRepeatIteration: 0 };
      }

      const nextIteration = currentRepeatIteration + 1;
      if (currentItem.enabled && nextIteration < currentItem.repeatCount) {
        return { ...state, currentRepeatIteration: nextIteration };
      }

      const nextIndex = findNextEnabledIndex(playlist, currentIndex + 1);
      if (nextIndex !== -1) {
        return { ...state, currentIndex: nextIndex, currentRepeatIteration: 0 };
      }

      if (infiniteLoop) {
        const firstEnabled = findFirstEnabledIndex(playlist);
        if (firstEnabled === -1) return { ...state, isPlaying: false };
        return {
          ...state,
          currentIndex: firstEnabled,
          currentRepeatIteration: 0,
        };
      }

      return {
        ...state,
        isPlaying: false,
        currentRepeatIteration: 0,
      };
    }

    case 'JUMP_TO_VERSE':
      return { ...state, currentIndex: action.index, currentRepeatIteration: 0, isPlaying: true };

    case 'SET_MODE':
      return { ...state, mode: action.mode, isPlaying: false, currentRepeatIteration: 0 };

    default:
      return state;
  }
}

interface PlayerContextValue {
  state: PlayerState;
  dispatch: Dispatch<PlayerAction>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.playlist));
    } catch { /* ignore */ }
  }, [state.playlist]);

  useEffect(() => {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, state.mode);
    } catch { /* ignore */ }
  }, [state.mode]);

  return (
    <PlayerContext.Provider value={{ state, dispatch }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
