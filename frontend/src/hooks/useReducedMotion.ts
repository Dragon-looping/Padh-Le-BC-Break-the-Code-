import { useState, useEffect } from 'react';

const STORAGE_KEY = 'padh-le-bc:reduced-motion';

function getMediaPref(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getStoredPref(): boolean | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'true') return true;
    if (v === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

export function useReducedMotion(): [boolean, (v: boolean) => void] {
  const [reduced, setReduced] = useState<boolean>(() => {
    const stored = getStoredPref();
    return stored ?? getMediaPref();
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      if (getStoredPref() === null) setReduced(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggle = (v: boolean) => {
    setReduced(v);
    try { localStorage.setItem(STORAGE_KEY, String(v)); } catch {}
  };

  return [reduced, toggle];
}
