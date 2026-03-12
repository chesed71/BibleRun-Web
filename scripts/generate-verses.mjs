import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const PROJECT_ROOT = join(import.meta.dirname, '..');
const INPUT_PATH = join(PROJECT_ROOT, 'bible_verses.json');
const AUDIO_DIR = join(PROJECT_ROOT, 'public', 'audio');
const OUTPUT_PATH = join(PROJECT_ROOT, 'src', 'data', 'verses.json');

const BOOK_EN_MAP = {
  '로마서': 'Romans',
  '마태복음': 'Matthew',
  '히브리서': 'Hebrews',
  '예레미야애가': 'Lamentations',
  '시편': 'Psalms',
  '디모데후서': '2 Timothy',
  '빌립보서': 'Philippians',
  '요한복음': 'John',
  '베드로후서': '2 Peter',
  '여호수아': 'Joshua',
  '예레미야': 'Jeremiah',
  '고린도후서': '2 Corinthians',
  '갈라디아서': 'Galatians',
  '사도행전': 'Acts',
  '고린도전서': '1 Corinthians',
  '디도서': 'Titus',
  '데살로니가전서': '1 Thessalonians',
  '에베소서': 'Ephesians',
  '요한일서': '1 John',
  '요한계시록': 'Revelation',
  '베드로전서': '1 Peter',
  '누가복음': 'Luke',
  '잠언': 'Proverbs',
  '신명기': 'Deuteronomy',
  '디모데전서': '1 Timothy',
  '마가복음': 'Mark',
};

function getDuration(mp3Path) {
  try {
    const result = execSync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${mp3Path}"`,
      { encoding: 'utf-8' }
    );
    return parseFloat(result.trim());
  } catch {
    console.warn(`Failed to get duration for: ${mp3Path}`);
    return 0;
  }
}

function extractVerseSuffix(filename) {
  const match = filename.match(/(\d+)([a-z])$/);
  return match ? match[2] : null;
}

function buildDisplayNameEn(bookEn, chapter, startVerse, endVerse, verseSuffix) {
  let ref = `${bookEn} ${chapter}:${startVerse}`;
  if (endVerse && endVerse !== startVerse) {
    ref += `-${endVerse}`;
  }
  if (verseSuffix) {
    ref += verseSuffix;
  }
  return ref;
}

const rawVerses = JSON.parse(readFileSync(INPUT_PATH, 'utf-8'));

const verses = rawVerses.map((v) => {
  const mp3File = `${v.filename}.mp3`;
  const mp3Path = join(AUDIO_DIR, mp3File);
  const duration = getDuration(mp3Path);
  const bookEn = BOOK_EN_MAP[v.book] || v.book;
  const verseSuffix = extractVerseSuffix(v.filename);

  return {
    id: v.id,
    filename: v.filename,
    book: v.book,
    bookEn,
    chapter: v.chapter,
    startVerse: v.start_verse,
    endVerse: v.end_verse,
    verseSuffix,
    reference: v.reference,
    displayNameEn: buildDisplayNameEn(bookEn, v.chapter, v.start_verse, v.end_verse, verseSuffix),
    text: v.text,
    audioFile: `/audio/${mp3File}`,
    duration: Math.round(duration * 100) / 100,
  };
});

writeFileSync(OUTPUT_PATH, JSON.stringify(verses, null, 2), 'utf-8');
console.log(`Generated ${verses.length} verses to ${OUTPUT_PATH}`);
