import { apiClient } from '../client';
import type {
  Dataset,
  DatasetProfile,
  DatasetConfig,
  DatasetConfigResponse,
} from '../types';

export async function uploadDataset(
  file: File,
  onProgress?: (pct: number, bytes: number) => void
): Promise<Dataset> {
  const form = new FormData();
  form.append('file', file);

  const response = await apiClient.post<Dataset>('/api/datasets/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        const pct = Math.round((evt.loaded * 100) / evt.total);
        onProgress(pct, evt.loaded);
      }
    },
  });

  return response.data;
}

export async function listDatasets(): Promise<Dataset[]> {
  const response = await apiClient.get<Dataset[]>('/api/datasets');
  return response.data;
}

export async function getDatasetProfile(id: string): Promise<DatasetProfile> {
  const response = await apiClient.get<DatasetProfile>(`/api/datasets/${id}/profile`);
  return response.data;
}

export async function configureDataset(
  id: string,
  config: Omit<DatasetConfig, 'dataset_id'>
): Promise<DatasetConfigResponse> {
  const response = await apiClient.post<DatasetConfigResponse>(
    `/api/datasets/${id}/configure`,
    config
  );
  return response.data;
}
