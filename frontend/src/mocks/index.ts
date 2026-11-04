import { mockAdapter } from './mockAdapter';
import { apiClient } from '../api/client';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

export function enableMocks() {
  // Replace the axios adapter with the mock adapter
  apiClient.defaults.adapter = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
    const result = await mockAdapter(config) as { data: unknown; status: number; headers: Record<string, string> };
    return {
      data: result.data,
      status: result.status,
      statusText: 'OK',
      headers: result.headers,
      config,
    } as AxiosResponse;
  };
}
