// Map raw API shapes to UI models.
// A backend shape change should touch only this file.

import type {
  Dataset,
  DatasetProfile,
  ColumnProfile,
  ExperimentRun,
  ModelResult,
  RecommendationResponse,
  Recommendation,
} from './types';

// ─── Dataset ─────────────────────────────────────────────────────────────────
export function mapDataset(raw: Dataset): Dataset {
  return {
    ...raw,
    // Ensure numeric fields are numbers
    rows: Number(raw.rows),
    columns: Number(raw.columns),
  };
}

// ─── Column ──────────────────────────────────────────────────────────────────
export function mapColumnProfile(raw: ColumnProfile): ColumnProfile {
  return {
    ...raw,
    missing_pct: raw.missing_pct ?? (raw.missing_values > 0 ? undefined : 0),
  };
}

export function mapDatasetProfile(raw: DatasetProfile): DatasetProfile {
  return {
    ...raw,
    row_count: Number(raw.row_count),
    column_count: Number(raw.column_count),
    columns: raw.columns.map(mapColumnProfile),
  };
}

// ─── Experiment ───────────────────────────────────────────────────────────────
export function mapModelResult(raw: ModelResult): ModelResult {
  return {
    ...raw,
    // Round float metrics for display
    accuracy: raw.accuracy != null ? Math.round(raw.accuracy * 10000) / 10000 : undefined,
    f1_score: raw.f1_score != null ? Math.round(raw.f1_score * 10000) / 10000 : undefined,
    cv_mean: raw.cv_mean != null ? Math.round(raw.cv_mean * 10000) / 10000 : undefined,
  };
}

export function mapExperimentRun(raw: ExperimentRun): ExperimentRun {
  return {
    ...raw,
    results: raw.results.map(mapModelResult),
  };
}

// ─── Recommendations ──────────────────────────────────────────────────────────
export function mapRecommendation(raw: Recommendation): Recommendation {
  return { ...raw };
}

export function mapRecommendationResponse(
  raw: RecommendationResponse
): RecommendationResponse {
  return {
    ...raw,
    recommendations: raw.recommendations.map(mapRecommendation),
  };
}
