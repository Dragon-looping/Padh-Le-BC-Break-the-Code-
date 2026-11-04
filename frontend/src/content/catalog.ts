// Static lesson catalog — slugs MUST match the backend lesson API slugs.
// See docs/API_CONTRACT.md for the full contract.

export interface CatalogEntry {
  slug: string;
  title: string;
  category: string;
  categoryIndex: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  blurb: string;
  type: 'algorithm' | 'concept';
  illustrationKey: string; // used to pick the SVG signature
}

export const CATALOG: CatalogEntry[] = [
  // ── Regression ───────────────────────────────────────────────────────────
  {
    slug: 'linear_regression',
    title: 'Linear Regression',
    category: 'Regression',
    categoryIndex: 1,
    difficulty: 'beginner',
    estimatedMinutes: 10,
    blurb: 'Fit the line. Predict the number. It is the simplest idea that works.',
    type: 'algorithm',
    illustrationKey: 'line',
  },
  {
    slug: 'multiple_linear_regression',
    title: 'Multiple Linear Regression',
    category: 'Regression',
    categoryIndex: 1,
    difficulty: 'beginner',
    estimatedMinutes: 12,
    blurb: 'More features, same idea. A hyperplane instead of a line.',
    type: 'algorithm',
    illustrationKey: 'hyperplane',
  },
  // ── Classification ────────────────────────────────────────────────────────
  {
    slug: 'logistic_regression',
    title: 'Logistic Regression',
    category: 'Classification',
    categoryIndex: 2,
    difficulty: 'beginner',
    estimatedMinutes: 12,
    blurb: 'A regression that outputs a probability. Same math, different interpretation.',
    type: 'algorithm',
    illustrationKey: 'sigmoid',
  },
  {
    slug: 'knn',
    title: 'K-Nearest Neighbours',
    category: 'Classification',
    categoryIndex: 2,
    difficulty: 'beginner',
    estimatedMinutes: 8,
    blurb: 'You are who you hang out with. The simplest classification idea.',
    type: 'algorithm',
    illustrationKey: 'knn',
  },
  // ── Trees and Ensembles ───────────────────────────────────────────────────
  {
    slug: 'decision_tree',
    title: 'Decision Tree',
    category: 'Trees and Ensembles',
    categoryIndex: 3,
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    blurb: 'A model you can read. Every prediction is a path you can trace.',
    type: 'algorithm',
    illustrationKey: 'tree',
  },
  {
    slug: 'random_forest',
    title: 'Random Forest',
    category: 'Trees and Ensembles',
    categoryIndex: 3,
    difficulty: 'intermediate',
    estimatedMinutes: 14,
    blurb: 'Many noisy trees. One reliable answer. Bagging in action.',
    type: 'algorithm',
    illustrationKey: 'forest',
  },
  {
    slug: 'gradient_boosting',
    title: 'Gradient Boosting',
    category: 'Trees and Ensembles',
    categoryIndex: 3,
    difficulty: 'advanced',
    estimatedMinutes: 18,
    blurb: 'Fix the mistakes of the last model. Repeat. Win.',
    type: 'algorithm',
    illustrationKey: 'residuals',
  },
  // ── Impurity and Information ──────────────────────────────────────────────
  {
    slug: 'gini_impurity',
    title: 'Gini Impurity',
    category: 'Impurity and Information',
    categoryIndex: 4,
    difficulty: 'intermediate',
    estimatedMinutes: 10,
    blurb: 'How mixed is this group? The number a decision tree minimises.',
    type: 'concept',
    illustrationKey: 'gini',
  },
  {
    slug: 'entropy',
    title: 'Information Entropy',
    category: 'Impurity and Information',
    categoryIndex: 4,
    difficulty: 'intermediate',
    estimatedMinutes: 10,
    blurb: 'Surprise as a number. Shannon said it first.',
    type: 'concept',
    illustrationKey: 'entropy',
  },
  // ── Data Preparation ──────────────────────────────────────────────────────
  {
    slug: 'preprocessing',
    title: 'Preprocessing',
    category: 'Data Preparation',
    categoryIndex: 5,
    difficulty: 'beginner',
    estimatedMinutes: 12,
    blurb: 'Garbage in, garbage out. Clean the data before the model sees it.',
    type: 'concept',
    illustrationKey: 'preprocess',
  },
  {
    slug: 'train_test_split',
    title: 'Train / Test Split',
    category: 'Data Preparation',
    categoryIndex: 5,
    difficulty: 'beginner',
    estimatedMinutes: 8,
    blurb: 'Hold some data back. The model should not see the exam questions.',
    type: 'concept',
    illustrationKey: 'split',
  },
  // ── Evaluation ────────────────────────────────────────────────────────────
  {
    slug: 'classification_metrics',
    title: 'Classification Metrics',
    category: 'Evaluation',
    categoryIndex: 6,
    difficulty: 'beginner',
    estimatedMinutes: 14,
    blurb: 'Accuracy is not enough. Know what precision and recall actually measure.',
    type: 'concept',
    illustrationKey: 'confusion',
  },
  {
    slug: 'regression_metrics',
    title: 'Regression Metrics',
    category: 'Evaluation',
    categoryIndex: 6,
    difficulty: 'beginner',
    estimatedMinutes: 10,
    blurb: 'MAE, MSE, RMSE, R². Four numbers, one story.',
    type: 'concept',
    illustrationKey: 'residual_bar',
  },
  {
    slug: 'cross_validation',
    title: 'Cross-Validation',
    category: 'Evaluation',
    categoryIndex: 6,
    difficulty: 'intermediate',
    estimatedMinutes: 12,
    blurb: 'One split is fragile. Five folds is robust.',
    type: 'concept',
    illustrationKey: 'folds',
  },
  // ── Generalisation ────────────────────────────────────────────────────────
  {
    slug: 'overfitting',
    title: 'Overfitting and Underfitting',
    category: 'Generalisation',
    categoryIndex: 7,
    difficulty: 'intermediate',
    estimatedMinutes: 12,
    blurb: 'Memorising versus generalising. The core tension in ML.',
    type: 'concept',
    illustrationKey: 'overfit',
  },
  {
    slug: 'bias_variance',
    title: 'Bias and Variance',
    category: 'Generalisation',
    categoryIndex: 7,
    difficulty: 'advanced',
    estimatedMinutes: 14,
    blurb: 'Two sources of error. You can reduce one or the other, rarely both.',
    type: 'concept',
    illustrationKey: 'bias_variance',
  },
  {
    slug: 'regularisation',
    title: 'Regularisation',
    category: 'Generalisation',
    categoryIndex: 7,
    difficulty: 'advanced',
    estimatedMinutes: 12,
    blurb: 'Penalise complexity. Lasso and Ridge in one idea.',
    type: 'concept',
    illustrationKey: 'regularise',
  },
];

export const CATEGORIES = Array.from(
  new Map(CATALOG.map((e) => [e.category, e.categoryIndex])).entries()
)
  .sort((a, b) => a[1] - b[1])
  .map(([name, index]) => ({ name, index }));
