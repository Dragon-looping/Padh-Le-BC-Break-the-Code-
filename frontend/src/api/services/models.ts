import { apiClient } from '../client';
import type { RecommendationResponse } from '../types';

export interface RecommendRequest {
  dataset_id: string;
  task_type: 'classification' | 'regression';
  experiment_id?: string;
}

export async function getRecommendations(
  req: RecommendRequest
): Promise<RecommendationResponse> {
  const response = await apiClient.post<RecommendationResponse>(
    '/api/models/recommend',
    req
  );
  return response.data;
}
