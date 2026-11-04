// Mock adapter — activated when VITE_USE_MOCKS=true
// Returns realistic JSON through the same service layer as real endpoints.

import type { AxiosRequestConfig } from 'axios';

// ─── Mock dataset store ───────────────────────────────────────────────────────
const MOCK_DATASETS = [
  {
    dataset_id: 'ds_iris',
    filename: 'iris.csv',
    rows: 150,
    columns: 5,
    status: 'configured',
    created_at: '2026-11-01T10:00:00Z',
  },
  {
    dataset_id: 'ds_cancer',
    filename: 'breast_cancer.csv',
    rows: 569,
    columns: 31,
    status: 'uploaded',
    created_at: '2026-11-02T14:30:00Z',
  },
];

const MOCK_PROFILE = {
  dataset_id: 'ds_iris',
  filename: 'iris.csv',
  row_count: 150,
  column_count: 5,
  duplicate_rows: 3,
  columns: [
    {
      name: 'sepal_length',
      type: 'numerical',
      missing_values: 0,
      missing_pct: 0,
      unique_count: 35,
      mean: 5.84,
      std: 0.83,
      min: 4.3,
      q25: 5.1,
      median: 5.8,
      q75: 6.4,
      max: 7.9,
      histogram: Array.from({ length: 10 }, (_, i) => ({ bin: 4.3 + i * 0.37, count: Math.floor(10 + Math.random() * 20) })),
    },
    {
      name: 'sepal_width',
      type: 'numerical',
      missing_values: 2,
      missing_pct: 1.3,
      unique_count: 23,
      mean: 3.06,
      std: 0.44,
      min: 2.0,
      q25: 2.8,
      median: 3.0,
      q75: 3.3,
      max: 4.4,
      histogram: Array.from({ length: 10 }, (_, i) => ({ bin: 2.0 + i * 0.24, count: Math.floor(5 + Math.random() * 30) })),
    },
    {
      name: 'petal_length',
      type: 'numerical',
      missing_values: 0,
      missing_pct: 0,
      unique_count: 43,
      mean: 3.76,
      std: 1.77,
      min: 1.0,
      q25: 1.6,
      median: 4.35,
      q75: 5.1,
      max: 6.9,
      histogram: Array.from({ length: 10 }, (_, i) => ({ bin: 1.0 + i * 0.59, count: Math.floor(8 + Math.random() * 25) })),
    },
    {
      name: 'petal_width',
      type: 'numerical',
      missing_values: 0,
      missing_pct: 0,
      unique_count: 22,
      mean: 1.2,
      std: 0.76,
      min: 0.1,
      q25: 0.3,
      median: 1.3,
      q75: 1.8,
      max: 2.5,
      histogram: Array.from({ length: 10 }, (_, i) => ({ bin: 0.1 + i * 0.24, count: Math.floor(10 + Math.random() * 20) })),
    },
    {
      name: 'species',
      type: 'categorical',
      missing_values: 0,
      missing_pct: 0,
      unique_count: 3,
      top_values: [
        { value: 'setosa', count: 50 },
        { value: 'versicolor', count: 50 },
        { value: 'virginica', count: 50 },
      ],
    },
  ],
  preview: Array.from({ length: 10 }, (_, i) => ({
    sepal_length: (4.3 + i * 0.3).toFixed(1),
    sepal_width: (2.5 + i * 0.1).toFixed(1),
    petal_length: (1.0 + i * 0.5).toFixed(1),
    petal_width: (0.1 + i * 0.2).toFixed(1),
    species: ['setosa', 'versicolor', 'virginica'][i % 3],
  })),
  target_candidates: ['species'],
  flags: [],
};

// Mock experiment state machine
interface MockExperiment {
  experiment_id: string;
  dataset_id: string;
  target_column: string;
  task_type: string;
  models: string[];
  startTime: number;
  trials: unknown[];
}

const mockExperiments = new Map<string, MockExperiment>();

function getMockExperimentState(exp: MockExperiment) {
  const elapsed = Date.now() - exp.startTime;
  const totalTime = 5000; // 5s to complete

  const modelResults = exp.models.map((model, idx) => {
    const modelElapsed = elapsed - idx * 800;
    if (modelElapsed < 0) return { model, status: 'queued' };
    if (modelElapsed < 1500) return { model, status: 'fitting' };
    if (modelElapsed < 2000) return { model, status: 'validating' };
    if (model === 'knn' && idx === 1) return {
      model, status: 'failed', error_message: 'KNN convergence error (simulated)'
    };

    // Done — assign mock scores
    const isClassification = exp.task_type === 'classification';
    const baseAcc = { logistic_regression: 0.967, knn: 0.933, decision_tree: 0.9, random_forest: 0.973, gradient_boosting: 0.98, linear_regression: null };
    const acc = (baseAcc[model as keyof typeof baseAcc] ?? 0.85) + (Math.random() * 0.02 - 0.01);

    return {
      model,
      status: 'done',
      ...(isClassification ? {
        accuracy: acc,
        precision: acc - 0.01,
        recall: acc - 0.005,
        f1_score: acc - 0.008,
        cv_mean: acc - 0.02,
        cv_std: 0.015,
        train_score: acc + 0.015,
        val_score: acc - 0.01,
        test_score: acc,
        confusion_matrix: [[48, 2], [1, 49]],
      } : {
        mae: 0.5 - acc * 0.3,
        mse: 0.3 - acc * 0.15,
        rmse: Math.sqrt(0.3 - acc * 0.15),
        r2: acc,
        cv_mean: acc - 0.02,
        cv_std: 0.015,
        train_score: acc + 0.02,
        val_score: acc - 0.01,
        test_score: acc,
      }),
      training_time: 0.1 + Math.random() * 0.5,
      predict_time: 0.01 + Math.random() * 0.05,
      feature_importance: [
        { feature: 'petal_length', importance: 0.45 },
        { feature: 'petal_width', importance: 0.4 },
        { feature: 'sepal_length', importance: 0.1 },
        { feature: 'sepal_width', importance: 0.05 },
      ],
    };
  });

  const allDone = modelResults.every(r => r.status === 'done' || r.status === 'failed');
  const anyRunning = modelResults.some(r => r.status === 'fitting' || r.status === 'validating');

  return {
    experiment_id: exp.experiment_id,
    dataset_id: exp.dataset_id,
    target_column: exp.target_column,
    task_type: exp.task_type,
    status: allDone ? 'complete' : anyRunning ? 'running' : elapsed > totalTime ? 'complete' : 'running',
    models: exp.models,
    results: modelResults,
    test_size: 0.2,
    random_state: 42,
    cv_folds: 5,
    primary_metric: exp.task_type === 'classification' ? 'accuracy' : 'r2',
    trials: exp.trials,
  };
}

// ─── Route matcher ────────────────────────────────────────────────────────────
export function mockAdapter(config: AxiosRequestConfig): Promise<unknown> {
  const url = config.url ?? '';
  const method = (config.method ?? 'get').toLowerCase();

  // POST /api/datasets/upload
  if (method === 'post' && url.includes('/api/datasets/upload')) {
    return simulateProgress(config, {
      dataset_id: `ds_${Date.now()}`,
      filename: 'uploaded.csv',
      rows: 150,
      columns: 5,
      status: 'uploaded',
      created_at: new Date().toISOString(),
    });
  }

  // GET /api/datasets
  if (method === 'get' && url.match(/\/api\/datasets$/)) {
    return delay({ data: MOCK_DATASETS, status: 200, headers: {} });
  }

  // GET /api/datasets/:id/profile
  const profileMatch = url.match(/\/api\/datasets\/([^/]+)\/profile/);
  if (method === 'get' && profileMatch) {
    return delay({ data: { ...MOCK_PROFILE, dataset_id: profileMatch[1] }, status: 200, headers: {} }, 600);
  }

  // POST /api/datasets/:id/configure
  const configureMatch = url.match(/\/api\/datasets\/([^/]+)\/configure/);
  if (method === 'post' && configureMatch) {
    return delay({
      data: {
        dataset_id: configureMatch[1],
        experiment_id: undefined,
        warnings: [],
        status: 'configured',
      },
      status: 200,
      headers: {},
    }, 400);
  }

  // POST /api/models/recommend
  if (method === 'post' && url.includes('/api/models/recommend')) {
    const body = JSON.parse(config.data as string ?? '{}');
    return delay({
      data: {
        dataset_id: body.dataset_id,
        task_type: body.task_type ?? 'classification',
        data_facts: [
          { id: 'size', label: 'Dataset size', value: '150 rows', type: 'size' },
          { id: 'features', label: 'Features', value: '4 numerical', type: 'feature_types' },
          { id: 'missing', label: 'Missing values', value: '1.3%', type: 'missing' },
          { id: 'balance', label: 'Class balance', value: 'Balanced (33/33/33%)', type: 'class_balance' },
        ],
        recommendations: [
          {
            model: 'random_forest',
            rank: 1,
            score: 0.973,
            reasons: [
              'Strong cross-validation performance on this dataset.',
              'Robust to the small number of missing values.',
              'Works well with balanced multi-class targets.',
            ],
            supported_by: {
              facts: ['size', 'balance'],
              results: ['accuracy', 'cv_mean'],
              lesson_links: [{ label: 'Random Forest', slug: 'random_forest' }],
            },
          },
          {
            model: 'decision_tree',
            rank: 2,
            score: 0.9,
            reasons: [
              'Highly interpretable — you can inspect every split.',
              'No feature scaling needed.',
            ],
            supported_by: {
              facts: ['features'],
              lesson_links: [{ label: 'Decision Tree', slug: 'decision_tree', section: 'how-it-works' }],
            },
          },
          {
            model: 'logistic_regression',
            rank: 3,
            score: 0.967,
            reasons: ['Fast to train.', 'Good baseline for comparison.'],
            supported_by: { lesson_links: [{ label: 'Logistic Regression', slug: 'logistic_regression' }] },
          },
        ],
        not_recommended: [
          { model: 'knn', reason: 'Sensitive to feature scale; would need normalisation which is not configured here.' },
        ],
      },
      status: 200,
      headers: {},
    }, 800);
  }

  // POST /api/experiments/run
  if (method === 'post' && url.match(/\/api\/experiments\/run$/)) {
    const body = JSON.parse(config.data as string ?? '{}');
    const experimentId = `exp_${Date.now()}`;
    mockExperiments.set(experimentId, {
      experiment_id: experimentId,
      dataset_id: body.dataset_id,
      target_column: body.target_column,
      task_type: body.task_type,
      models: body.models,
      startTime: Date.now(),
      trials: [],
    });
    return delay({
      data: getMockExperimentState(mockExperiments.get(experimentId)!),
      status: 200,
      headers: {},
    }, 300);
  }

  // GET /api/experiments/:id
  const expMatch = url.match(/\/api\/experiments\/([^/]+)$/);
  if (method === 'get' && expMatch) {
    const exp = mockExperiments.get(expMatch[1]);
    if (!exp) {
      return Promise.reject({ kind: 'validation', status: 404, message: 'Experiment not found.' });
    }
    return delay({ data: getMockExperimentState(exp), status: 200, headers: {} }, 200);
  }

  // POST /api/experiments/:id/tune
  const tuneMatch = url.match(/\/api\/experiments\/([^/]+)\/tune/);
  if (method === 'post' && tuneMatch) {
    const body = JSON.parse(config.data as string ?? '{}');
    const exp = mockExperiments.get(tuneMatch[1]);
    const trial = {
      trial_id: `trial_${Date.now()}`,
      model: body.model ?? 'decision_tree',
      parameters: body.parameters,
      train_score: 0.95 - Math.random() * 0.1,
      val_score: 0.88 - Math.random() * 0.1,
      test_score: 0.87 - Math.random() * 0.1,
      complexity: {
        depth: (body.parameters?.max_depth as number) ?? 5,
        leaves: Math.pow(2, Math.min((body.parameters?.max_depth as number) ?? 5, 8)),
        nodes: Math.pow(2, Math.min((body.parameters?.max_depth as number) ?? 5, 8)) * 2 - 1,
      },
      created_at: new Date().toISOString(),
    };
    if (exp) exp.trials.push(trial);
    return delay({ data: { trial, trials: exp?.trials ?? [trial] }, status: 200, headers: {} }, 1500);
  }

  // GET /api/lessons/:algorithm
  const lessonMatch = url.match(/\/api\/lessons\/([^/]+)/);
  if (method === 'get' && lessonMatch) {
    return delay({ data: getMockLesson(lessonMatch[1]), status: 200, headers: {} }, 400);
  }

  // GET /api/experiments/:id/report
  const reportMatch = url.match(/\/api\/experiments\/([^/]+)\/report/);
  if (method === 'get' && reportMatch) {
    return delay({
      data: {
        experiment_id: reportMatch[1],
        generated_at: new Date().toISOString(),
        summary: 'Sample experiment report. All numbers are illustrative mock data.',
        best_model: 'random_forest',
        primary_metric: 'accuracy',
        primary_metric_value: 0.973,
        model_results: [],
        recommendations: ['Consider Random Forest for production use.'],
      },
      status: 200,
      headers: { 'content-type': 'application/json' },
    }, 500);
  }

  return Promise.reject({ kind: 'validation', status: 404, message: `Mock: no handler for ${method.toUpperCase()} ${url}` });
}

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

async function simulateProgress(config: AxiosRequestConfig, result: unknown): Promise<unknown> {
  const onProgress = config.onUploadProgress;
  if (onProgress) {
    const total = 1024 * 50; // simulate 50KB
    for (let loaded = 0; loaded <= total; loaded += total / 10) {
      await delay(null, 150);
      onProgress({ loaded, total, bytes: total / 10, rate: 1000, estimated: 0, progress: loaded / total, upload: true } as ProgressEvent & { bytes: number; rate: number; estimated: number; progress: number; upload: boolean });
    }
  }
  return delay({ data: result, status: 200, headers: {} }, 200);
}

function getMockLesson(slug: string) {
  return {
    slug,
    title: slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    category: 'Trees and Ensembles',
    difficulty: 'intermediate',
    estimated_minutes: 12,
    blurb: `Learn how ${slug.replace(/_/g, ' ')} works, when to use it, and how it differs from similar algorithms.`,
    sections: [
      {
        id: 'what',
        title: 'What it is',
        type: 'text',
        content: `A ${slug.replace(/_/g, ' ')} is a supervised learning algorithm. This is sample content — connect to the real API for full lesson content.`,
      },
      {
        id: 'why',
        title: 'Why it is used',
        type: 'text',
        content: 'It is widely used because it is interpretable, fast to train, and handles both numerical and categorical features.',
      },
      {
        id: 'how',
        title: 'How it works',
        type: 'text',
        content: 'The algorithm recursively partitions the feature space by selecting the split that minimises impurity at each step.',
      },
      {
        id: 'math',
        title: 'Mathematical explanation',
        type: 'math',
        content: 'The Gini impurity of a node is defined as:',
        math: 'G(t) = 1 - \\sum_{k=1}^{K} p_k^2',
      },
      {
        id: 'advantages',
        title: 'Advantages and limitations',
        type: 'advantages',
        content: 'Advantages: interpretable, no scaling needed. Limitations: prone to overfitting without constraints.',
      },
      {
        id: 'experiment',
        title: 'Practical experiment',
        type: 'experiment',
        content: 'Try this algorithm in the Studio with Gini criterion.',
        studio_link: { params: { model: slug, criterion: 'gini' }, label: 'Take this to the Studio' },
      },
    ],
    related: ['random_forest', 'gradient_boosting'],
  };
}
