# PADH LE BC (Break the Code) — API Contract

This document specifies the exact REST API contracts, shapes, and frontend assumptions for integration between the React frontend and FastAPI backend.

---

## 1. Global Conventions

- **Base URL:** Defined via `VITE_API_BASE_URL` (defaults to `http://localhost:8000`).
- **Data format:** JSON for all payloads except multipart form upload.
- **Identifiers:** String slugs and IDs (`ds_iris`, `exp_001`, `trial_01`).
- **Error format:**
```json
{
  "detail": "Human-readable explanation of error or validation constraint failure"
}
```

---

## 2. Endpoints Specification

### 2.1 Dataset Upload
- **Method:** `POST /api/datasets/upload`
- **Request:** `multipart/form-data` with `file: File (.csv)`
- **Response:** `200 OK`
```json
{
  "dataset_id": "ds_173072849",
  "filename": "student_scores.csv",
  "rows": 500,
  "columns": 6,
  "status": "uploaded",
  "created_at": "2026-11-04T12:00:00Z"
}
```

### 2.2 List Datasets
- **Method:** `GET /api/datasets`
- **Response:** `200 OK`
```json
[
  {
    "dataset_id": "ds_iris",
    "filename": "iris.csv",
    "rows": 150,
    "columns": 5,
    "status": "configured",
    "created_at": "2026-11-01T10:00:00Z"
  }
]
```

### 2.3 Dataset Profile ("Specimen Sheet")
- **Method:** `GET /api/datasets/{id}/profile`
- **Response:** `200 OK`
```json
{
  "dataset_id": "ds_iris",
  "filename": "iris.csv",
  "row_count": 150,
  "column_count": 5,
  "duplicate_rows": 3,
  "columns": [
    {
      "name": "sepal_length",
      "type": "numerical",
      "missing_values": 0,
      "missing_pct": 0.0,
      "unique_count": 35,
      "mean": 5.84,
      "std": 0.83,
      "min": 4.3,
      "q25": 5.1,
      "median": 5.8,
      "q75": 6.4,
      "max": 7.9,
      "histogram": [
        { "bin": 4.3, "count": 12 },
        { "bin": 4.7, "count": 24 }
      ]
    },
    {
      "name": "species",
      "type": "categorical",
      "missing_values": 0,
      "missing_pct": 0.0,
      "unique_count": 3,
      "top_values": [
        { "value": "setosa", "count": 50 },
        { "value": "versicolor", "count": 50 },
        { "value": "virginica", "count": 50 }
      ]
    }
  ],
  "preview": [
    { "sepal_length": 5.1, "sepal_width": 3.5, "species": "setosa" }
  ],
  "target_candidates": ["species"],
  "flags": [
    {
      "type": "identifier",
      "column": "id",
      "message": "Sequential monotonic integer column looks like a database row ID.",
      "severity": "warning"
    }
  ]
}
```

### 2.4 Configure Target & Task
- **Method:** `POST /api/datasets/{id}/configure`
- **Request:** `application/json`
```json
{
  "target_column": "species",
  "task_type": "classification",
  "excluded_columns": ["id"]
}
```
- **Response:** `200 OK`
```json
{
  "dataset_id": "ds_iris",
  "status": "configured",
  "warnings": []
}
```

### 2.5 Run Model Tournament ("Starting Grid")
- **Method:** `POST /api/experiments/run`
- **Request:** `application/json`
```json
{
  "dataset_id": "ds_iris",
  "target_column": "species",
  "task_type": "classification",
  "models": [
    "logistic_regression",
    "knn",
    "decision_tree",
    "random_forest",
    "gradient_boosting"
  ],
  "test_size": 0.2,
  "random_state": 42,
  "cross_validation_folds": 5
}
```
- **Response:** `200 OK` (Experiment run object with initial queued/running states)

### 2.6 Retrieve Experiment State
- **Method:** `GET /api/experiments/{id}`
- **Response:** `200 OK`
```json
{
  "experiment_id": "exp_173072849",
  "dataset_id": "ds_iris",
  "target_column": "species",
  "task_type": "classification",
  "status": "complete",
  "models": ["decision_tree", "random_forest"],
  "results": [
    {
      "model": "decision_tree",
      "status": "done",
      "accuracy": 0.90,
      "precision": 0.89,
      "recall": 0.90,
      "f1_score": 0.895,
      "cv_mean": 0.88,
      "cv_std": 0.02,
      "train_score": 0.96,
      "val_score": 0.90,
      "training_time": 0.08,
      "predict_time": 0.002,
      "feature_importance": [
        { "feature": "petal_length", "importance": 0.52 },
        { "feature": "petal_width", "importance": 0.42 }
      ],
      "confusion_matrix": [[48, 2], [1, 49]]
    }
  ]
}
```

### 2.7 Tune Hyperparameter Trial
- **Method:** `POST /api/experiments/{id}/tune`
- **Request:** `application/json`
```json
{
  "model": "decision_tree",
  "parameters": {
    "max_depth": 4,
    "min_samples_split": 2,
    "min_samples_leaf": 1,
    "criterion": "gini"
  }
}
```
- **Response:** `200 OK`
```json
{
  "trial": {
    "trial_id": "trial_03",
    "model": "decision_tree",
    "parameters": { "max_depth": 4, "criterion": "gini" },
    "train_score": 0.96,
    "val_score": 0.92,
    "test_score": 0.91,
    "complexity": { "depth": 4, "leaves": 12, "nodes": 23 },
    "created_at": "2026-11-04T12:30:00Z"
  },
  "trials": [...]
}
```

### 2.8 Model Recommendations ("The Verdict")
- **Method:** `POST /api/models/recommend`
- **Request:** `application/json`
```json
{
  "dataset_id": "ds_iris",
  "task_type": "classification",
  "experiment_id": "exp_173072849"
}
```
- **Response:** `200 OK`
```json
{
  "dataset_id": "ds_iris",
  "task_type": "classification",
  "data_facts": [
    { "id": "size", "label": "Dataset size", "value": "150 rows", "type": "size" },
    { "id": "features", "label": "Features", "value": "4 numerical", "type": "feature_types" }
  ],
  "recommendations": [
    {
      "model": "random_forest",
      "rank": 1,
      "score": 0.973,
      "reasons": [
        "Strong cross-validation performance on this dataset.",
        "Robust to small missing values."
      ],
      "supported_by": {
        "facts": ["size"],
        "results": ["accuracy", "cv_mean"],
        "lesson_links": [{ "label": "Random Forest", "slug": "random_forest" }]
      }
    }
  ],
  "not_recommended": [
    { "model": "knn", "reason": "Sensitive to unscaled distance variations without standardisation." }
  ]
}
```

### 2.9 Lesson Content
- **Method:** `GET /api/lessons/{algorithm}`
- **Response:** `200 OK` (Structured lesson object with sections, KaTeX expressions, and studio preset links).

### 2.10 Experiment Report
- **Method:** `GET /api/experiments/{id}/report`
- **Response:** `200 OK` (JSON report payload or PDF/HTML stream).

---

## 3. Algorithm Slugs Catalog

The frontend catalog relies on these uniform slugs:
- `linear_regression`
- `multiple_linear_regression`
- `logistic_regression`
- `knn`
- `decision_tree`
- `random_forest`
- `gradient_boosting`
- `gini_impurity`
- `entropy`
- `preprocessing`
- `train_test_split`
- `classification_metrics`
- `regression_metrics`
- `cross_validation`
- `overfitting`
- `bias_variance`
- `regularisation`
