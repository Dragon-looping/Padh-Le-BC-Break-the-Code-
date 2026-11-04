import { useState, useCallback, useRef } from 'react';
import type { ApiError } from '../api/types';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: ApiError | null;
}

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: null,
    error: null,
  });
  const isMountedRef = useRef(true);

  const run = useCallback(async (promise: Promise<T>) => {
    setState({ status: 'loading', data: null, error: null });
    try {
      const data = await promise;
      if (isMountedRef.current) {
        setState({ status: 'success', data, error: null });
      }
      return data;
    } catch (err) {
      if (isMountedRef.current) {
        setState({
          status: 'error',
          data: null,
          error: err as ApiError,
        });
      }
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', data: null, error: null });
  }, []);

  return { ...state, run, reset };
}
