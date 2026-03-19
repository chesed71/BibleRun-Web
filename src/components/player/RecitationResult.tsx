import type { RecitationResult as Result } from '../../types';
import styles from './RecitationResult.module.css';

interface Props {
  result: Result;
  reference: string;
  onRetry: () => void;
  onNext: () => void;
}

export function RecitationResult({ result, reference, onRetry, onNext }: Props) {
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return styles.accuracyHigh;
    if (accuracy >= 70) return styles.accuracyMedium;
    return styles.accuracyLow;
  };

  const getAccuracyMessage = (accuracy: number) => {
    if (accuracy === 100) return '완벽해요!';
    if (accuracy >= 90) return '거의 다 맞았어요!';
    if (accuracy >= 70) return '잘하고 있어요!';
    if (accuracy >= 50) return '조금 더 연습해볼까요?';
    return '다시 한번 도전해봐요!';
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.accuracy} ${getAccuracyColor(result.accuracy)}`}>
        <span className={styles.accuracyNumber}>{result.accuracy}%</span>
        <span className={styles.accuracyMessage}>{getAccuracyMessage(result.accuracy)}</span>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>정답 — {reference}</p>
        <div className={styles.segments}>
          {result.segments.map((seg, i) => (
            <span key={i} className={styles[seg.type]}>
              {seg.text}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>내가 읽은 내용</p>
        <p className={styles.transcriptText}>{result.transcript}</p>
      </div>

      <div className={styles.buttons}>
        <button className={styles.retryButton} onClick={onRetry}>
          다시 도전
        </button>
        <button className={styles.nextButton} onClick={onNext}>
          다음 구절
        </button>
      </div>
    </div>
  );
}
