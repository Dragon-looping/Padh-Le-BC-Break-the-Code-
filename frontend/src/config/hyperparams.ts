// Hyperparameter UI configuration (UI-only, no model logic)
export interface ParamDef {
  key: string;
  label: string;
  type: 'slider' | 'segmented' | 'stepper';
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string | number; label: string }[];
  defaultValue: string | number | null;
  lessonSlug?: string;
  lessonSection?: string;
  description: string;
  unlimitedOption?: boolean; // for max_depth
}

export const DECISION_TREE_PARAMS: ParamDef[] = [
  {
    key: 'max_depth',
    label: 'Max Depth',
    type: 'slider',
    min: 1,
    max: 20,
    step: 1,
    defaultValue: null,
    unlimitedOption: true,
    lessonSlug: 'decision_tree',
    lessonSection: 'how-it-works',
    description: 'Maximum depth of the tree. Deeper trees overfit; shallower trees may underfit.',
  },
  {
    key: 'min_samples_split',
    label: 'Min Samples Split',
    type: 'stepper',
    min: 2,
    max: 50,
    step: 1,
    defaultValue: 2,
    lessonSlug: 'decision_tree',
    lessonSection: 'overfitting',
    description: 'Minimum samples required to split a node. Higher values prevent learning noise.',
  },
  {
    key: 'min_samples_leaf',
    label: 'Min Samples Leaf',
    type: 'stepper',
    min: 1,
    max: 50,
    step: 1,
    defaultValue: 1,
    lessonSlug: 'decision_tree',
    lessonSection: 'overfitting',
    description: 'Minimum samples required at a leaf. Acts as regularisation.',
  },
  {
    key: 'criterion',
    label: 'Criterion',
    type: 'segmented',
    options: [
      { value: 'gini', label: 'Gini' },
      { value: 'entropy', label: 'Entropy' },
      { value: 'log_loss', label: 'Log Loss' },
    ],
    defaultValue: 'gini',
    lessonSlug: 'decision_tree',
    lessonSection: 'impurity',
    description: 'Measure of split quality. Gini and entropy give similar results in practice.',
  },
];

export const REGRESSION_TREE_PARAMS: ParamDef[] = [
  {
    key: 'max_depth',
    label: 'Max Depth',
    type: 'slider',
    min: 1,
    max: 20,
    step: 1,
    defaultValue: null,
    unlimitedOption: true,
    description: 'Maximum depth of the tree.',
  },
  {
    key: 'min_samples_split',
    label: 'Min Samples Split',
    type: 'stepper',
    min: 2,
    max: 50,
    step: 1,
    defaultValue: 2,
    description: 'Minimum samples required to split a node.',
  },
  {
    key: 'min_samples_leaf',
    label: 'Min Samples Leaf',
    type: 'stepper',
    min: 1,
    max: 50,
    step: 1,
    defaultValue: 1,
    description: 'Minimum samples at a leaf.',
  },
  {
    key: 'criterion',
    label: 'Criterion',
    type: 'segmented',
    options: [
      { value: 'squared_error', label: 'Squared Error' },
      { value: 'friedman_mse', label: 'Friedman MSE' },
      { value: 'absolute_error', label: 'Absolute Error' },
    ],
    defaultValue: 'squared_error',
    description: 'Split quality measure for regression.',
  },
];

export const UPLOAD_SIZE_LIMIT_MB = 25;
export const UPLOAD_SIZE_LIMIT_BYTES = UPLOAD_SIZE_LIMIT_MB * 1024 * 1024;

export const CLASSIFICATION_MODELS = [
  'logistic_regression',
  'knn',
  'decision_tree',
  'random_forest',
  'gradient_boosting',
] as const;

export const REGRESSION_MODELS = [
  'linear_regression',
  'decision_tree',
  'random_forest',
  'gradient_boosting',
] as const;

export const MODEL_LABELS: Record<string, string> = {
  logistic_regression: 'Logistic Regression',
  knn: 'KNN',
  decision_tree: 'Decision Tree',
  random_forest: 'Random Forest',
  gradient_boosting: 'Gradient Boosting',
  linear_regression: 'Linear Regression',
};

export const MODEL_COLORS: Record<string, string> = {
  logistic_regression: '#1E3CFF',
  knn: '#FF9EC4',
  decision_tree: '#C6F432',
  random_forest: '#FF5B1F',
  gradient_boosting: '#0A1033',
  linear_regression: '#1E3CFF',
};
