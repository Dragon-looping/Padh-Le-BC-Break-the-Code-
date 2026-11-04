// ─── API Types ────────────────────────────────────────────────────────────────
// Provisional types based on the API contract spec.
// Map raw API shapes through mappers.ts before using in components.

export interface Dataset {
  dataset_id: string;
  filename: string;
  rows: number;
  columns: number;
  status: 'uploaded' | 'profiled' | 'configured';
  created_at?: string;
}

export interface ColumnProfile {
  name: string;
  type: 'numerical' | 'categorical' | 'other';
  missing_values: number;
  missing_pct?: number;
  unique_count?: number;
  // For numerical
  mean?: number;
  std?: number;
  min?: number;
  q25?: number;
  median?: number;
  q75?: number;
  max?: number;
  histogram?: { bin: number; count: number }[];
  // For categorical
  top_values?: { value: string; count: number }[];
  // Flags
  is_identifier_suspect?: boolean;
  is_leakage_suspect?: boolean;
  is_constant?: boolean;
  is_high_missing?: boolean;
}

export interface DatasetProfile {
  dataset_id: string;
  filename: string;
  row_count: number;
  column_count: number;
  columns: ColumnProfile[];
  preview: Record<string, unknown>[];
  target_candidates?: string[];
  duplicate_rows?: number;
  missingness_matrix?: boolean[][];  // rows x cols, true = missing
  flags?: DatasetFlag[];
}

export interface DatasetFlag {
  type: 'identifier' | 'leakage' | 'unsuitable_target' | 'high_missing' | 'constant';
  column: string;
  message: string;
  severity: 'blocking' | 'warning';
}

export interface DatasetConfig {
  dataset_id: string;
  target_column: string;
  task_type: 'classification' | 'regression';
  excluded_columns?: string[];
}

export interface DatasetConfigResponse {
  dataset_id: string;
  experiment_id?: string;
  warnings?: DatasetFlag[];
  status: string;
}

export interface Recommendation {
  model: string;
  rank: number;
  score?: number;
  reasons: string[];
  supported_by?: {
    facts?: string[];
    results?: string[];
    lesson_links?: { label: string; slug: string; section?: string }[];
  };
}

export interface RecommendationResponse {
  dataset_id: string;
  task_type: 'classification' | 'regression';
  recommendations: Recommendation[];
  not_recommended?: { model: string; reason: string }[];
  data_facts?: DataFact[];
}

export interface DataFact {
  id: string;
  label: string;
  value: string | number;
  type: 'size' | 'missing' | 'feature_types' | 'class_balance' | 'other';
}

export type ModelStatus = 'queued' | 'fitting' | 'validating' | 'done' | 'failed';

export interface ModelResult {
  model: string;
  status: ModelStatus;
  // Classification
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  confusion_matrix?: number[][];
  // Regression
  mae?: number;
  mse?: number;
  rmse?: number;
  r2?: number;
  // Both
  cv_mean?: number;
  cv_std?: number;
  train_score?: number;
  val_score?: number;
  test_score?: number;
  training_time?: number;
  predict_time?: number;
  feature_importance?: { feature: string; importance: number }[];
  error_message?: string;
  // For regression extras
  predicted_vs_actual?: { predicted: number; actual: number }[];
}

export interface ExperimentRun {
  experiment_id: string;
  dataset_id: string;
  target_column: string;
  task_type: 'classification' | 'regression';
  status: 'running' | 'complete' | 'failed';
  models: string[];
  results: ModelResult[];
  created_at?: string;
  completed_at?: string;
  test_size?: number;
  random_state?: number;
  cv_folds?: number;
  primary_metric?: string;
}

export interface TrialResult {
  trial_id: string;
  model: string;
  parameters: Record<string, unknown>;
  train_score: number;
  val_score: number;
  test_score?: number;
  complexity?: {
    depth?: number;
    leaves?: number;
    nodes?: number;
  };
  created_at: string;
}

export interface TuneRequest {
  model: string;
  parameters: Record<string, unknown>;
}

export interface TuneResponse {
  trial: TrialResult;
  trials: TrialResult[];
}

export interface LessonSection {
  id: string;
  title: string;
  type: 'text' | 'math' | 'worked_example' | 'comparison' | 'advantages' | 'when_to_use' | 'experiment';
  content: string;
  math?: string;        // KaTeX expression
  table?: { headers: string[]; rows: (string | number)[][] };
  studio_link?: { params: Record<string, unknown>; label: string };
}

export interface Lesson {
  slug: string;
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_minutes: number;
  blurb: string;
  sections: LessonSection[];
  related?: string[];
}

export interface ExperimentReport {
  experiment_id: string;
  generated_at: string;
  summary: string;
  best_model: string;
  primary_metric: string;
  primary_metric_value: number;
  model_results: ModelResult[];
  recommendations?: string[];
}

// ─── Error type ───────────────────────────────────────────────────────────────
export interface ApiError {
  kind: 'network' | 'validation' | 'server' | 'unknown';
  status?: number;
  message: string;
  details?: unknown;
}
