import type { RecitationSegment } from '../types';

function normalize(text: string): string {
  return text
    .replace(/[.,;:!?'"''""·…\-()[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function compareTexts(
  original: string,
  transcript: string,
): { accuracy: number; segments: RecitationSegment[] } {
  const origWords = normalize(original).split(' ');
  const transWords = normalize(transcript).split(' ');

  const dp: number[][] = Array.from({ length: origWords.length + 1 }, () =>
    Array(transWords.length + 1).fill(0),
  );

  for (let i = 0; i <= origWords.length; i++) dp[i][0] = i;
  for (let j = 0; j <= transWords.length; j++) dp[0][j] = j;

  for (let i = 1; i <= origWords.length; i++) {
    for (let j = 1; j <= transWords.length; j++) {
      if (origWords[i - 1] === transWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const segments: RecitationSegment[] = [];
  let i = origWords.length;
  let j = transWords.length;

  const ops: Array<{ type: 'correct' | 'wrong' | 'missing'; text: string }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i - 1] === transWords[j - 1]) {
      ops.push({ type: 'correct', text: origWords[i - 1] });
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.push({ type: 'wrong', text: origWords[i - 1] });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.push({ type: 'missing', text: origWords[i - 1] });
      i--;
    } else {
      j--;
    }
  }

  ops.reverse();

  // Merge consecutive segments of the same type
  for (const op of ops) {
    const last = segments[segments.length - 1];
    if (last && last.type === op.type) {
      last.text += ' ' + op.text;
    } else {
      segments.push({ type: op.type, text: op.text });
    }
  }

  const correctCount = ops.filter((o) => o.type === 'correct').length;
  const accuracy = origWords.length > 0 ? Math.round((correctCount / origWords.length) * 100) : 0;

  return { accuracy, segments };
}
