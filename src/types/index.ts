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
  practiceAudioFile: string;
  duration: number;
}

export interface PlaylistItem {
  verseId: number;
  enabled: boolean;
  repeatCount: number;
  order: number;
}

export type RepeatMode = 'off' | 'all' | 'one';
export type PlayMode = 'listen' | 'recite' | 'check';

export interface RecitationResult {
  transcript: string;
  accuracy: number;
  segments: RecitationSegment[];
}

export interface RecitationSegment {
  text: string;
  type: 'correct' | 'wrong' | 'missing';
}

export interface PlayerState {
  playlist: PlaylistItem[];
  isPlaying: boolean;
  currentIndex: number;
  currentRepeatIteration: number;
  infiniteLoop: boolean;
  repeatMode: RepeatMode;
  speed: number;
  mode: PlayMode;
}
