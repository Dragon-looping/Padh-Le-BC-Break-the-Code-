<<<<<<< Updated upstream
# PADH LE BC — Break the Code 🚀

> **Tagline:** Learn the algorithm. Understand the result. Choose with confidence.

An educational Machine Learning platform backend that helps students understand ML algorithms, experiment with real datasets, benchmark and compare models fairly, and select suitable algorithms based on authentic evaluation results.

This is a real ML application powered by Scikit-learn, Pandas, NumPy, FastAPI, and SQLite. No fake metrics, no chatbot wrappers, no mock training.

---

## 🛠️ Technology Stack

- **Framework:** FastAPI (Python 3.11 / 3.12 / 3.14 compatible)
- **ASGI Server:** Uvicorn
- **Machine Learning:** Scikit-learn
- **Data Manipulation:** Pandas & NumPy
- **Database:** SQLite with SQLAlchemy ORM
- **Schema & Validation:** Pydantic v2
- **Testing:** Pytest (25 test cases passing)
- **File Uploads:** python-multipart

---

## 🏗️ Architecture & Modules

The backend is built as a clean, modular monolith:

```text
backend/
├── app/
│   ├── main.py                  # FastAPI entry point, lifespan, CORS, routes
│   │
│   ├── routes/
│   │   ├── datasets.py          # CSV upload, profiling, target/task configuration
│   │   ├── models.py            # Model registry inspection, pre-training advisor
│   │   ├── experiments.py       # Training runs, tuning, history, report generation
│   │   ├── lessons.py           # Structured educational lessons
│   │   └── explain.py           # Gini, Entropy, Information Gain explainer
│   │
│   ├── core/
│   │   ├── dataset_manager.py   # Safe CSV file saving and metadata recording
│   │   ├── dataset_analyzer.py  # Automated profiling, summary stats, distributions
│   │   ├── task_detector.py     # Classification vs. Regression compatibility analysis
│   │   ├── preprocessing.py     # ColumnTransformer pipelines (Imputation, OneHot, Scaling)
│   │   ├── model_registry.py    # Supported models, metadata, hyperparameter specs
│   │   ├── trainer.py           # Fair splitting, pipeline execution, persistence
│   │   ├── evaluator.py         # Real metric calculations, generalization gap, confusion matrix
│   │   ├── comparator.py        # Objective model benchmarking and ranking table
│   │   ├── recommender.py       # Pre-training and post-training educational Model Advisor
│   │   └── explainer.py         # Step-by-step mathematical calculations for tree splits
│   │
│   ├── lessons/
│   │   ├── decision_tree.json
│   │   ├── knn.json
│   │   ├── logistic_regression.json
│   │   ├── random_forest.json
│   │   └── linear_regression.json
│   │
│   ├── database/
│   │   ├── db.py                # Database session, engine, initialisation & sample seeding
│   │   └── models.py            # DatasetModel, ExperimentModel, ModelResultModel
│   │
│   ├── schemas/
│   │   ├── dataset.py           # Pydantic request/response schemas for datasets
│   │   ├── model.py             # Model registry & advisor schemas
│   │   ├── experiment.py        # Experiment run, tune, and comparison schemas
│   │   └── explain.py           # Impurity and split explainer schemas
│   │
│   └── utils/
│       ├── file_utils.py        # Path traversal guard, CSV loading, unique ID generation
│       └── validators.py        # Target column & feature validation
│
├── datasets/
│   ├── sample/                  # Pre-bundled offline datasets (Iris, Wine, Cancer, etc.)
│   └── uploads/                 # User-uploaded CSV datasets
│
├── tests/                       # Pytest test suite
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start Instructions

### 1. Navigate to the backend directory
```bash
cd backend
```

### 2. Create and activate a virtual environment

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the development server
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- **Backend API:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`
- **Health Check:** `http://127.0.0.1:8000/api/health`

---

## 🧪 Running Tests

Execute the complete pytest test suite:

```bash
python -m pytest backend/tests -v
```

All 25 tests verify real ML training, data integrity, error handling, and mathematical derivations:
- `test_health.py`: Health check and root route.
- `test_explain.py`: Manually verifiable Gini (pure = 0.0, 50/50 = 0.5), Entropy (pure = 0.0, 50/50 = 1.0), and Information Gain step-by-step.
- `test_datasets.py`: CSV uploads, empty CSV rejection, profiling, target configuration, task detection.
- `test_ml_pipeline.py`: Model listing, pre-training advisor, real multiclass classification on Iris, regression on salaries, incompatible model rejection.
- `test_experiment_studio.py`: Retraining on identical splits with tuned hyperparameters, calculating performance deltas, retrieving reports.
- `test_lessons.py`: JSON lesson retrieval and 404 handling.

---

## 📡 API Contract for Frontend Integration

The backend provides clean REST APIs with JSON responses for the React + TypeScript frontend.

### 1. Health Check
`GET /api/health`

**Response (200 OK):**
```json
{
  "status": "healthy",
  "app": "PADH LE BC (Break the Code)",
  "version": "1.0.0",
  "timestamp": "2026-11-04T15:23:56.115204Z",
  "tagline": "Learn the algorithm. Understand the result. Choose with confidence."
}
=======
# PADH LE BC — Break the Code

> "Learn the algorithm. Understand the result. Choose with confidence."

PADH LE BC is an interactive Machine Learning Learning Lab and Model Selection Assistant built with React, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts, and Three.js.

---

## 1. Quick Start

### Prerequisites
- Node.js >= 18 (Tested on v24)
- npm >= 9

### Installation & Development
```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts at `http://localhost:5173`.

### Production Build
```bash
cd frontend
npm run build
npm run preview
>>>>>>> Stashed changes
```

---

<<<<<<< Updated upstream
### 2. List Datasets
`GET /api/datasets`

Returns built-in sample datasets (Iris, Wine, Breast Cancer, Diabetes, Tech Salaries, Student Performance) and user-uploaded datasets.

**Response (200 OK):**
```json
[
  {
    "id": "sample_iris",
    "name": "Iris Flower Classification",
    "filename": "iris.csv",
    "row_count": 150,
    "column_count": 5,
    "target_column": "species",
    "task_type": "classification",
    "is_sample": true,
    "created_at": "2026-11-04T15:23:56Z"
  }
]
```

---

### 3. Upload Dataset
`POST /api/datasets/upload`
- Form data: `file: <CSV file>` (Max size: 25 MB)

**Response (201 Created):**
```json
{
  "dataset_id": "ds_a1b2c3d4e5f6",
  "name": "Student Exam Performance",
  "filename": "ds_a1b2c3d4e5f6_student_data.csv",
  "row_count": 300,
  "column_count": 5,
  "status": "uploaded",
  "message": "Dataset uploaded, validated, and registered successfully."
}
```

---

### 4. Profile Dataset
`GET /api/datasets/{dataset_id}/profile`

Returns column types, missing value percentages, numerical statistics (mean, std, quartiles), categorical frequencies, class distribution (with imbalance detection), correlations, and preview rows.

---

### 5. Configure Target & Task
`POST /api/datasets/{dataset_id}/configure`

**Request:**
```json
{
  "target_column": "species",
  "task_type": "classification",
  "selected_features": ["sepal_length", "sepal_width", "petal_length", "petal_width"]
}
```

**Response (200 OK):**
```json
{
  "dataset_id": "sample_iris",
  "target_column": "species",
  "task_type": "classification",
  "selected_features": ["sepal_length", "sepal_width", "petal_length", "petal_width"],
  "validation_report": {
    "is_valid": true,
    "detected_task": "classification",
    "recommended_task": "classification",
    "warnings": [],
    "target_unique_count": 3,
    "target_data_type": "categorical"
  },
  "message": "Dataset target, task type, and feature configurations successfully saved."
}
```

---

### 6. Model Advisor (Pre-Training Recommendation)
`POST /api/models/recommend`

**Request:**
```json
{
  "dataset_id": "sample_iris",
  "target_column": "species",
  "task_type": "classification"
}
```

**Response (200 OK):**
```json
{
  "dataset_id": "sample_iris",
  "target_column": "species",
  "task_type": "classification",
  "dataset_characteristics": {
    "row_count": 150,
    "feature_count": 4,
    "numerical_feature_count": 4,
    "categorical_feature_count": 0,
    "missing_value_count": 0,
    "task_type": "classification",
    "target_classes_count": 3,
    "is_imbalanced": false
  },
  "recommended": [
    {
      "model_id": "decision_tree",
      "display_name": "Decision Tree Classifier",
      "suitability": "Highly Recommended",
      "score": 9,
      "reasons": [
        "Highly intuitive split rules that show exact feature thresholds.",
        "Handles mixed data types and requires no feature scaling."
      ],
      "limitations": [
        "Susceptible to high variance and overfitting if max_depth is unrestricted."
      ],
      "educational_tip": "Start with a max_depth of 3-5 to inspect clear tree decisions before expanding."
    }
  ],
  "consider": [],
  "not_recommended": [],
  "overall_guidance": "For this classification dataset (150 rows, 4 features), we advise comparing a simple interpretable model against an ensemble..."
}
```

---

### 7. Run Model Comparison Experiment
`POST /api/experiments/run`

**Request:**
```json
{
  "dataset_id": "sample_iris",
  "target_column": "species",
  "task_type": "classification",
  "models": ["logistic_regression", "knn", "decision_tree", "random_forest"],
  "test_size": 0.2,
  "random_state": 42,
  "cross_validation_folds": 5,
  "priority": "best_performance"
}
```

**Response (201 Created):**
```json
{
  "experiment_id": "exp_7f8a9b0c1d2e",
  "dataset_id": "sample_iris",
  "target_column": "species",
  "task_type": "classification",
  "test_size": 0.2,
  "random_state": 42,
  "cross_validation_folds": 5,
  "selected_features": ["sepal_length", "sepal_width", "petal_length", "petal_width"],
  "results": [
    {
      "model_name": "logistic_regression",
      "display_name": "Logistic Regression",
      "metrics": {
        "accuracy": 1.0,
        "precision": 1.0,
        "recall": 1.0,
        "f1_score": 1.0,
        "averaging_method": "weighted",
        "cv_mean": 0.9667,
        "cv_std": 0.0298,
        "classification_report": { ... }
      },
      "parameters": { "C": 1.0, "max_iter": 1000, "solver": "lbfgs" },
      "training_time": 0.0124,
      "prediction_time": 0.0011,
      "confusion_matrix": {
        "labels": ["setosa", "versicolor", "virginica"],
        "matrix": [[10, 0, 0], [0, 9, 0], [0, 0, 11]]
      },
      "train_score": 0.975,
      "test_score": 1.0,
      "generalization_gap": -0.025,
      "overfitting_risk": "Low",
      "explanation": "Logistic Regression generalizes exceptionally well with consistent performance across train and test sets."
    }
  ],
  "comparison_table": [
    {
      "model_name": "logistic_regression",
      "display_name": "Logistic Regression",
      "rank": 1,
      "primary_metric_name": "f1_score",
      "primary_metric_value": 1.0,
      "secondary_metric_value": 1.0,
      "cv_mean": 0.9667,
      "cv_std": 0.0298,
      "training_time": 0.0124,
      "interpretability": "High",
      "train_test_gap": -0.025,
      "badges": ["🏆 Top Pick", "⚡ Fastest Training", "🔍 Highly Interpretable", "🛡️ Low Overfit Risk"]
    }
  ],
  "recommendation": {
    "winning_model": "logistic_regression",
    "winning_display_name": "Logistic Regression",
    "priority_used": "best_performance",
    "executive_summary": "Based on your criteria ('Best Performance'), Logistic Regression ranks #1...",
    "why_it_won": [
      "Achieved top F1-score of 100.0% on held-out test data.",
      "Demonstrated reliable cross-validation performance of 96.7% (±3.0%).",
      "Low generalization gap between training and testing splits."
    ],
    "trade_offs": ["No major deficiencies detected under current dataset conditions."],
    "student_takeaway": "In Machine Learning, no algorithm is universally superior ('No Free Lunch Theorem')..."
  },
  "created_at": "2026-11-04T15:23:56Z"
}
```

---

### 8. Experiment Studio (Hyperparameter Tuning)
`POST /api/experiments/{experiment_id}/tune`

**Request:**
```json
{
  "model_name": "decision_tree",
  "hyperparameters": {
    "max_depth": 3,
    "min_samples_split": 4,
    "criterion": "gini"
  }
}
```

**Response (200 OK):**
```json
{
  "experiment_id": "exp_7f8a9b0c1d2e",
  "model_name": "decision_tree",
  "display_name": "Decision Tree Classifier",
  "applied_parameters": { "criterion": "gini", "max_depth": 3, "min_samples_split": 4, "min_samples_leaf": 1 },
  "original_metrics": { "accuracy": 0.9667, "f1_score": 0.9665 },
  "tuned_metrics": { "accuracy": 1.0, "f1_score": 1.0 },
  "metric_differences": {
    "accuracy": { "original": 0.9667, "tuned": 1.0, "difference": 0.0333, "improved": true },
    "f1_score": { "original": 0.9665, "tuned": 1.0, "difference": 0.0335, "improved": true }
  },
  "educational_impact_analysis": "Setting `max_depth=3` altered model complexity. Constraint `min_samples_split=4` limits granular node splitting to prevent overfitting.",
  "train_test_gap_change": "Train score: 0.9833, Test score: 1.0 (Generalization gap: -0.0167, Risk: Low)."
}
```

---

### 9. Decision Tree Explainer
- `POST /api/explain/gini`
- `POST /api/explain/entropy`
- `POST /api/explain/information-gain`

**Example Request (`POST /api/explain/information-gain`):**
```json
{
  "parent_counts": [50, 50],
  "children": [
    { "child_name": "Left Child (x <= 5)", "class_counts": [45, 5] },
    { "child_name": "Right Child (x > 5)", "class_counts": [5, 45] }
  ],
  "criterion": "entropy"
}
```

**Response (200 OK):**
```json
{
  "criterion": "entropy",
  "parent_impurity": 1.0,
  "parent_counts": { "Class_0": 50, "Class_1": 50 },
  "total_samples": 100,
  "children": [
    {
      "child_name": "Left Child (x <= 5)",
      "class_counts": { "Class_0": 45, "Class_1": 5 },
      "sample_count": 50,
      "weight": 0.5,
      "impurity_value": 0.469,
      "probabilities": { "Class_0": 0.9, "Class_1": 0.1 }
    },
    {
      "child_name": "Right Child (x > 5)",
      "class_counts": { "Class_0": 5, "Class_1": 45 },
      "sample_count": 50,
      "weight": 0.5,
      "impurity_value": 0.469,
      "probabilities": { "Class_0": 0.1, "Class_1": 0.9 }
    }
  ],
  "weighted_child_impurity": 0.469,
  "information_gain": 0.531,
  "step_by_step_explanation": [
    "1. Parent Node Entropy = 1.0 (Total samples: 100)",
    "2. Child Nodes Impurities:",
    "   • Left Child (x <= 5): 50 samples (weight=0.5), Entropy=0.469",
    "   • Right Child (x > 5): 50 samples (weight=0.5), Entropy=0.469",
    "3. Weighted Child Entropy = (50/100) * 0.469 + (50/100) * 0.469 = 0.469",
    "4. Information Gain = Parent Entropy - Weighted Child Entropy = 1.0 - 0.469 = 0.531"
  ],
  "evaluation_verdict": "Excellent split! Produces high Information Gain (0.531), significantly purifying the subset."
}
```

---

### 10. Learning Lab Lessons
- `GET /api/lessons`
- `GET /api/lessons/{algorithm}` (e.g., `decision_tree`, `knn`, `logistic_regression`, `random_forest`, `linear_regression`)

---

## 🔒 Security & Best Practices

1. **Upload Protection:** Maximum upload file size enforced (25 MB chunked reading to prevent memory exhaustion).
2. **Path Traversal Protection:** Absolute paths verified strictly against allowed upload and sample directories using `is_safe_path()`.
3. **Data Leakage Prevention:** Preprocessing pipelines (`StandardScaler`, `SimpleImputer`, `OneHotEncoder`) are strictly fit **only** on training splits, never on the full dataset or test sets.
4. **CORS:** Configurable allowed origins (`CORS_ORIGINS` in `.env`), preventing open wildcard origins in production.
5. **Robust Schema Enforcement:** Strict Pydantic v2 schemas reject invalid hyperparameters, malformed payloads, or non-numeric regression targets.
=======
## 2. Environment Variables

Create `.env` in the `frontend` folder:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | FastAPI backend REST endpoint URL |
| `VITE_USE_MOCKS` | `true` | When `true`, all requests run through the client-side mock adapter. When `false`, real network requests are dispatched to `VITE_API_BASE_URL`. |

When `VITE_USE_MOCKS=true`, an amber `SAMPLE DATA` badge is pinned to the bottom-right corner of the interface so students and evaluators are always aware when viewing simulated metrics.

---

## 3. How Mocks Work

The frontend features an offline mock engine located in `src/mocks/mockAdapter.ts`:
- **Stateful simulations:** Uploading files simulates upload progress and generates specimen records.
- **Tournament progression:** Launching the Arena simulates model fitting (`queued` → `fitting` → `validating` → `done`), providing honest indeterminate progress bars rather than instantaneous fake results.
- **Hyperparameter feedback:** The Studio's "Execute Trial Run" computes real simulated tree depth, node count, leaf bounds, and bias-variance gaps.
- **Seamless toggle:** Switching `VITE_USE_MOCKS=false` directs all service calls to the FastAPI backend with zero changes in UI components.

---

## 4. Design System & Tokens

### Palette
The visual identity uses a light warm paper theme accented by an iconic high-contrast split:
- **Paper (`#F3EFE4`):** Warm editorial background.
- **Paper 2 (`#E8E3D4`):** Secondary ruled panels and card surfaces.
- **Ink (`#0A1033`):** Deep navy ink for typography, borders, and inverted instrument readouts.
- **Cobalt (`#1E3CFF`):** Class 0 / primary action buttons / links.
- **Lime (`#C6F432`):** Class 1 / highlights / success tags (always bordered by 1.5px ink stroke on paper).
- **Orange (`#FF5B1F`):** **THE CUT** — split thresholds, attention ticks, active stations.
- **Blush (`#FF9EC4`):** Secondary category / KNN indicator.
- **Silver (`#AEB4BF`):** Neutral margins, gridlines, and baseline marks.
- **Error (`#C4210F`):** Destructive error banners and blocking issues.

### The Brand Device: "THE CUT"
A decision tree learns by making cuts: finding the threshold that turns a mixed group into pure partitions. The recurring orange slicing line appears throughout the platform:
- Story loader split exit.
- Interactive hero point-cloud partition and manual threshold range controller.
- Decision Tree Split Lab interactive threshold dragline.
- Route change transitions (`CutTransition`).
- Section dividing hairlines with orange ticks.

### Typography
- **Display:** `Bricolage Grotesque` (700–800 weight, tight tracking, uppercase).
- **Accent:** `Instrument Serif Italic` (single emphasised word per headline).
- **Data & Readouts:** `JetBrains Mono` with `tabular-nums`.
- **Body:** `Instrument Sans` (16–18px, 1.55 line-height).

---

## 5. Architecture & Routes

- `/` — Landing Page + The Bench Dashboard.
- `/lab` — Learning Lab Catalog Index.
- `/lab/:algorithm` — Algorithm Detail with step-scrubbers, KaTeX mathematical lens, and interactive Split Lab showpiece.
- `/datasets` — CSV Upload with marching dropzone and specimen vault.
- `/datasets/:id` — Specimen Profile Sheet (row/column numerals, column ribbon, missing meters).
- `/datasets/:id/configure` — Target column selection and classification/regression setup.
- `/arena/:datasetId` — Model Arena (Starting Grid live race and re-ranking).
- `/advisor/:experimentId` — Model Advisor (The Verdict, evidence synthesis map, non-recommended disclosure).
- `/studio/:experimentId` — Experiment Studio (schema-driven hyperparameter control surface, line scoreboard).
- `/results/:experimentId` — Results Dashboard (confusion matrices, feature importances, comparison matrix).
- `/results/:experimentId/report` — Printable audit report with blob download.
- `*` — Styled 404 with the Cut motif.

---

## 6. Technical Deviations

1. **Vite 8 / Rolldown Code-Splitting:**
   - In Vite 8 with Rolldown, `output.manualChunks` requires a function `(id) => chunkName` rather than an object map. Chunks are split cleanly into `three-vendor`, `charts`, `katex`, and `motion`.
2. **Subagents Substitution:**
   - Subagents reached individual user quota during earlier execution. All 11 pages and components were subsequently authored directly, preserving all design guidelines, strict TypeScript rules, and responsive styling.

---

## 7. API Contract

For complete REST specifications, payload schemas, and backend mapping expectations, see [docs/API_CONTRACT.md](docs/API_CONTRACT.md).
>>>>>>> Stashed changes
