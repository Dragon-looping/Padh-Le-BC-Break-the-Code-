import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
  interval?: number;
  maxBackoff?: number;
  onStop?: () => void;
}

export function usePolling(
  fn: () => Promise<boolean>, // return true to stop
  active: boolean,
  options: UsePollingOptions = {}
) {
  const { interval = 1500, maxBackoff = 8000 } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentInterval = useRef(interval);
  const isMounted = useRef(true);

  const poll = useCallback(async () => {
    if (!isMounted.current) return;
    try {
      const shouldStop = await fn();
      if (shouldStop || !isMounted.current) {
        currentInterval.current = interval;
        return;
      }
      // Gentle backoff
      currentInterval.current = Math.min(currentInterval.current * 1.1, maxBackoff);
    } catch {
      currentInterval.current = Math.min(currentInterval.current * 1.5, maxBackoff);
    }

    if (isMounted.current && active) {
      timeoutRef.current = setTimeout(poll, currentInterval.current);
    }
  }, [fn, interval, maxBackoff, active]);

  useEffect(() => {
    isMounted.current = true;
    if (!active) return;
    currentInterval.current = interval;
    timeoutRef.current = setTimeout(poll, interval);

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [active, interval, poll]);
}
