import { useState, useRef, useCallback } from 'react';
import type { RecitationResult } from '../types';
import { compareTexts } from '../utils/compareTexts';

type RecitationStatus = 'idle' | 'recording' | 'processing' | 'done';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition() {
  const [status, setStatus] = useState<RecitationStatus>('idle');
  const [result, setResult] = useState<RecitationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef('');

  const isSupported = !!getSpeechRecognition();

  const startRecording = useCallback((originalText: string) => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setError('이 브라우저에서는 음성 인식을 지원하지 않아요. Chrome을 사용해주세요.');
      return;
    }

    setResult(null);
    setError(null);
    transcriptRef.current = '';

    const recognition = new SR();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.continuous = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      transcriptRef.current = transcript;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        setError('음성이 감지되지 않았어요. 다시 시도해주세요.');
      } else if (event.error === 'not-allowed') {
        setError('마이크 권한을 허용해주세요.');
      } else {
        setError(`음성 인식 오류: ${event.error}`);
      }
      setStatus('idle');
    };

    recognition.onend = () => {
      if (status === 'recording' || transcriptRef.current) {
        setStatus('processing');
        const transcript = transcriptRef.current.trim();
        if (transcript) {
          const { accuracy, segments } = compareTexts(originalText, transcript);
          setResult({ transcript, accuracy, segments });
          setStatus('done');
        } else {
          setError('음성이 감지되지 않았어요. 다시 시도해주세요.');
          setStatus('idle');
        }
      }
    };

    recognition.start();
    setStatus('recording');
  }, [status]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopRecording();
    setStatus('idle');
    setResult(null);
    setError(null);
    transcriptRef.current = '';
  }, [stopRecording]);

  return { status, result, error, isSupported, startRecording, stopRecording, reset };
}
