export interface Verse {
  id: number;
  filename: string;
  book: string;
  bookEn: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  verseSuffix: string | null;
  reference: string;
  displayNameEn: string;
  text: string;
  audioFile: string;
  duration: number;
}

export interface PlaylistItem {
  verseId: number;
  enabled: boolean;
  repeatCount: number;
  order: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerState {
  playlist: PlaylistItem[];
  isPlaying: boolean;
  currentIndex: number;
  currentRepeatIteration: number;
  globalRepeatCount: number;
  globalRepeatIteration: number;
  infiniteLoop: boolean;
  repeatMode: RepeatMode;
  speed: number;
}
