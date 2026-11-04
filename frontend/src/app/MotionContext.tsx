import React, { createContext, useContext } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface MotionContextValue {
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
}

const MotionContext = createContext<MotionContextValue | null>(null);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotion] = useReducedMotion();

  return (
    <MotionContext.Provider value={{ reducedMotion, setReducedMotion }}>
      {children}
    </MotionContext.Provider>
  );
}

export function useMotion(): MotionContextValue {
  const ctx = useContext(MotionContext);
  if (!ctx) throw new Error('useMotion must be used within MotionProvider');
  return ctx;
}
