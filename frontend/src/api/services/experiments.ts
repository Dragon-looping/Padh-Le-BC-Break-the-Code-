import { apiClient } from '../client';
import type { ExperimentRun, TuneRequest, TuneResponse, ExperimentReport } from '../types';

export interface RunRequest {
  dataset_id: string;
  target_column: string;
  task_type: 'classification' | 'regression';
  models: string[];
  test_size?: number;
  random_state?: number;
  cross_validation_folds?: number;
}

export async function runExperiment(req: RunRequest): Promise<ExperimentRun> {
  const response = await apiClient.post<ExperimentRun>('/api/experiments/run', req);
  return response.data;
}

export async function getExperiment(id: string): Promise<ExperimentRun> {
  const response = await apiClient.get<ExperimentRun>(`/api/experiments/${id}`);
  return response.data;
}

export async function tuneExperiment(
  id: string,
  req: TuneRequest
): Promise<TuneResponse> {
  const response = await apiClient.post<TuneResponse>(
    `/api/experiments/${id}/tune`,
    req
  );
  return response.data;
}

export async function getExperimentReport(id: string): Promise<ExperimentReport> {
  const response = await apiClient.get<ExperimentReport>(
    `/api/experiments/${id}/report`
  );
  return response.data;
}

export async function downloadReport(id: string): Promise<{ blob: Blob; filename: string }> {
  const response = await apiClient.get(`/api/experiments/${id}/report`, {
    responseType: 'blob',
  });
  const contentType = (response.headers['content-type'] as string) ?? 'application/json';
  let ext = 'json';
  if (contentType.includes('pdf')) ext = 'pdf';
  else if (contentType.includes('html')) ext = 'html';

  return {
    blob: response.data as Blob,
    filename: `experiment-${id}-report.${ext}`,
  };
}
