import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  return config;
});

// ─── Response interceptor — normalise errors ──────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError: ApiError = {
      kind: 'unknown',
      message: 'An unexpected error occurred.',
    };

    if (!error.response) {
      apiError.kind = 'network';
      apiError.message = 'Network error — check your connection and try again.';
    } else {
      const status = error.response.status;
      apiError.status = status;

      if (status >= 400 && status < 500) {
        apiError.kind = 'validation';
        const data = error.response.data as Record<string, unknown>;
        apiError.message =
          (data?.detail as string) ??
          (data?.message as string) ??
          `Request error (${status}).`;
        apiError.details = data;
      } else if (status >= 500) {
        apiError.kind = 'server';
        apiError.message = `Server error (${status}) — please try again later.`;
        apiError.details = error.response.data;
      }
    }

    return Promise.reject(apiError);
  }
);
