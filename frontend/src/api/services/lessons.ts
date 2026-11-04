import { apiClient } from '../client';
import type { Lesson } from '../types';

export async function getLesson(algorithm: string): Promise<Lesson> {
  const response = await apiClient.get<Lesson>(`/api/lessons/${algorithm}`);
  return response.data;
}
