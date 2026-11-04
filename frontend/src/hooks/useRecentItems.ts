import { useState, useCallback } from 'react';

const KEY_EXPERIMENTS = 'padh-le-bc:recent-experiments';
const KEY_LESSONS = 'padh-le-bc:recent-lessons';
const MAX_ITEMS = 5;

function readList(key: string): string[] {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as string[]) : [];
  } catch { return []; }
}

function writeList(key: string, list: string[]) {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch {}
}

function addToList(key: string, id: string): string[] {
  const list = readList(key).filter((x) => x !== id);
  const next = [id, ...list].slice(0, MAX_ITEMS);
  writeList(key, next);
  return next;
}

export function useRecentExperiments() {
  const [items, setItems] = useState<string[]>(() => readList(KEY_EXPERIMENTS));
  const add = useCallback((id: string) => { setItems(addToList(KEY_EXPERIMENTS, id)); }, []);
  return { items, add };
}

export function useRecentLessons() {
  const [items, setItems] = useState<string[]>(() => readList(KEY_LESSONS));
  const add = useCallback((id: string) => { setItems(addToList(KEY_LESSONS, id)); }, []);
  return { items, add };
}
