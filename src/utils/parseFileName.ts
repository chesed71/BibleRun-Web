export interface ParsedFileName {
  id: number;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
  verseSuffix: string | null;
}

export function parseFileName(filename: string): ParsedFileName | null {
  const name = filename.replace(/\.(wav|mp3)$/, '');
  const match = name.match(/^(\d+)_(.+?)_(\d+)_(\d+)(?:_(\d+))?([a-z])?$/);
  if (!match) return null;

  const [, idStr, book, chapterStr, verseStartStr, verseEndStr, suffix] = match;

  return {
    id: parseInt(idStr, 10),
    book,
    chapter: parseInt(chapterStr, 10),
    verseStart: parseInt(verseStartStr, 10),
    verseEnd: verseEndStr ? parseInt(verseEndStr, 10) : null,
    verseSuffix: suffix || null,
  };
}
