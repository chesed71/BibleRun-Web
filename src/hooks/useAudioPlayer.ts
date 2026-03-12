import { useRef, useState, useEffect, useCallback } from 'react';

interface UseAudioPlayerOptions {
  src: string | null;
  nextSrc: string | null;
  speed: number;
  onEnded: () => void;
}

interface UseAudioPlayerReturn {
  currentTime: number;
  duration: number;
  isLoading: boolean;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
}

export function useAudioPlayer({ src, nextSrc, speed, onEnded }: UseAudioPlayerOptions): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!src) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    if (preloadRef.current && preloadRef.current.src.endsWith(encodeURI(src).replace(/%2F/g, '/'))) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.ontimeupdate = null;
      }
      audioRef.current = preloadRef.current;
      preloadRef.current = null;
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.ontimeupdate = null;
      }
      audioRef.current = new Audio(src);
    }

    const audio = audioRef.current;
    audio.playbackRate = speed;
    setIsLoading(true);

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleEnded = () => onEnded();
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [src, onEnded, speed]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  useEffect(() => {
    if (nextSrc) {
      if (!preloadRef.current || !preloadRef.current.src.endsWith(encodeURI(nextSrc).replace(/%2F/g, '/'))) {
        preloadRef.current = new Audio(nextSrc);
        preloadRef.current.preload = 'auto';
      }
    }
  }, [nextSrc]);

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  return { currentTime, duration, isLoading, play, pause, seek };
}
