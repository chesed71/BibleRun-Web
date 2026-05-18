import { useEffect } from 'react';
import styles from './Toast.module.css';

interface Props {
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, onDismiss, duration = 1800 }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, onDismiss, duration]);

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      {message}
    </div>
  );
}
