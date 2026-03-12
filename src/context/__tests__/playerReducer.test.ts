import { describe, it, expect } from 'vitest';
import { playerReducer, initialState } from '../PlayerContext';
import type { PlayerState, PlaylistItem } from '../../types';

function makePlaylist(...items: Partial<PlaylistItem>[]): PlaylistItem[] {
  return items.map((item, i) => ({
    verseId: item.verseId ?? i + 1,
    enabled: item.enabled ?? true,
    repeatCount: item.repeatCount ?? 1,
    order: item.order ?? i,
  }));
}

function makeState(overrides: Partial<PlayerState> = {}): PlayerState {
  return { ...initialState, ...overrides };
}

describe('playerReducer', () => {
  describe('ADVANCE_TO_NEXT', () => {
    it('keeps same verse when individual repeat not exhausted', () => {
      const state = makeState({
        playlist: makePlaylist({ verseId: 1, repeatCount: 3 }),
        currentIndex: 0,
        currentRepeatIteration: 0,
        isPlaying: true,
      });
      const next = playerReducer(state, { type: 'ADVANCE_TO_NEXT' });
      expect(next.currentIndex).toBe(0);
      expect(next.currentRepeatIteration).toBe(1);
      expect(next.isPlaying).toBe(true);
    });

    it('moves to next enabled verse when repeat exhausted', () => {
      const state = makeState({
        playlist: makePlaylist({ verseId: 1, repeatCount: 1 }, { verseId: 2, repeatCount: 1 }),
        currentIndex: 0,
        currentRepeatIteration: 0,
        isPlaying: true,
      });
      const next = playerReducer(state, { type: 'ADVANCE_TO_NEXT' });
      expect(next.currentIndex).toBe(1);
      expect(next.currentRepeatIteration).toBe(0);
    });

    it('skips disabled verses', () => {
      const state = makeState({
        playlist: makePlaylist(
          { verseId: 1, repeatCount: 1 },
          { verseId: 2, enabled: false },
          { verseId: 3, repeatCount: 1 },
        ),
        currentIndex: 0,
        currentRepeatIteration: 0,
        isPlaying: true,
      });
      const next = playerReducer(state, { type: 'ADVANCE_TO_NEXT' });
      expect(next.currentIndex).toBe(2);
    });

    it('restarts playlist when global repeat not exhausted', () => {
      const state = makeState({
        playlist: makePlaylist({ verseId: 1, repeatCount: 1 }),
        currentIndex: 0,
        currentRepeatIteration: 0,
        globalRepeatCount: 3,
        globalRepeatIteration: 0,
        isPlaying: true,
      });
      const next = playerReducer(state, { type: 'ADVANCE_TO_NEXT' });
      expect(next.currentIndex).toBe(0);
      expect(next.globalRepeatIteration).toBe(1);
      expect(next.isPlaying).toBe(true);
    });

    it('keeps playing in infinite loop mode', () => {
      const state = makeState({
        playlist: makePlaylist({ verseId: 1, repeatCount: 1 }),
        currentIndex: 0,
        currentRepeatIteration: 0,
        globalRepeatCount: 1,
        globalRepeatIteration: 0,
        infiniteLoop: true,
        isPlaying: true,
      });
      const next = playerReducer(state, { type: 'ADVANCE_TO_NEXT' });
      expect(next.currentIndex).toBe(0);
      expect(next.isPlaying).toBe(true);
    });

    it('stops when all repeats exhausted', () => {
      const state = makeState({
        playlist: makePlaylist({ verseId: 1, repeatCount: 1 }),
        currentIndex: 0,
        currentRepeatIteration: 0,
        globalRepeatCount: 1,
        globalRepeatIteration: 0,
        infiniteLoop: false,
        isPlaying: true,
      });
      const next = playerReducer(state, { type: 'ADVANCE_TO_NEXT' });
      expect(next.isPlaying).toBe(false);
    });
  });

  describe('TOGGLE_VERSE_ENABLED', () => {
    it('toggles enabled state', () => {
      const state = makeState({
        playlist: makePlaylist({ verseId: 1, enabled: true }),
      });
      const next = playerReducer(state, { type: 'TOGGLE_VERSE_ENABLED', verseId: 1 });
      expect(next.playlist[0].enabled).toBe(false);
      const next2 = playerReducer(next, { type: 'TOGGLE_VERSE_ENABLED', verseId: 1 });
      expect(next2.playlist[0].enabled).toBe(true);
    });
  });

  describe('ADD_VERSE / REMOVE_VERSE', () => {
    it('adds verse to playlist', () => {
      const state = makeState({ playlist: [] });
      const next = playerReducer(state, { type: 'ADD_VERSE', verseId: 5 });
      expect(next.playlist).toHaveLength(1);
      expect(next.playlist[0].verseId).toBe(5);
      expect(next.playlist[0].enabled).toBe(true);
      expect(next.playlist[0].repeatCount).toBe(1);
    });

    it('does not add duplicate verse', () => {
      const state = makeState({
        playlist: makePlaylist({ verseId: 5 }),
      });
      const next = playerReducer(state, { type: 'ADD_VERSE', verseId: 5 });
      expect(next.playlist).toHaveLength(1);
    });

    it('removes verse from playlist', () => {
      const state = makeState({
        playlist: makePlaylist({ verseId: 1 }, { verseId: 2 }, { verseId: 3 }),
      });
      const next = playerReducer(state, { type: 'REMOVE_VERSE', verseId: 2 });
      expect(next.playlist).toHaveLength(2);
      expect(next.playlist.map((p) => p.verseId)).toEqual([1, 3]);
    });
  });
});
