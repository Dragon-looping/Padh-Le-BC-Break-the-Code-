# PADH LE BC — API Contract Reference

This document defines the REST API contract between the FastAPI backend and the React/TypeScript frontend.

## Base URL
Development: `http://127.0.0.1:8000`
Swagger UI: `http://127.0.0.1:8000/docs`

---

## 1. System Endpoints

### `GET /api/health`
Checks server status.
```json
{
  "status": "healthy",
  "app": "PADH LE BC (Break the Code)",
  "version": "1.0.0",
  "timestamp": "2026-11-04T15:23:56Z",
  "tagline": "Learn the algorithm. Understand the result. Choose with confidence."
}
```

---

## 2. Dataset Management

### `POST /api/datasets/upload`
Uploads a CSV file using `multipart/form-data`.
- Form Field: `file` (File, .csv format, max 25MB)

**Response (201 Created):**
```json
{
  "dataset_id": "ds_45a2b1c3d4e5",
  "name": "Student Performance",
  "filename": "ds_45a2b1c3d4e5_student_performance.csv",
  "row_count": 300,
  "column_count": 5,
  "status": "uploaded",
  "message": "Dataset uploaded, validated, and registered successfully."
}
```

### `GET /api/datasets`
Returns all datasets (both built-in offline samples and user uploads).

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

### `GET /api/datasets/{dataset_id}/profile`
Returns deep statistical profiling:
- `row_count`, `column_count`, `duplicate_rows`
- `columns`: list of objects with `name`, `data_type` ("numerical" or "categorical"), `missing_count`, `missing_percentage`, `unique_count`, `is_potential_target`, `is_potential_identifier`, `warning`
- `numerical_stats`: `min`, `max`, `mean`, `std`, `median`, `q25`, `q75`
- `categorical_stats`: `unique_count`, `top_value`, `top_frequency`, `value_counts`
- `sample_preview`: first 8 rows as JSON objects
- `target_candidates`: list of column names suspected to be targets
- `class_distribution`: class counts, `imbalance_ratio`, `is_imbalanced`
- `correlations`: pairwise Pearson correlation matrix for numeric columns

### `POST /api/datasets/{dataset_id}/configure`
Explicitly configure target column and task type.

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

## 3. Models & Advisor

### `GET /api/models`
Optional query param: `task_type=classification` or `task_type=regression`
Returns list of registered algorithms with:
- `model_id`, `display_name`, `task_type`, `description`
- `interpretability` ("High", "Moderate", "Low")
- `training_speed`, `prediction_speed`
- `requires_scaling` (boolean)
- `default_parameters` (dict)
- `supported_parameters` (list of param specifications: name, type, default, min/max or options, description)

### `POST /api/models/recommend`
Pre-training Model Advisor inspecting dataset characteristics.

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
  "recommended": [ ... ],
  "consider": [ ... ],
  "not_recommended": [ ... ],
  "overall_guidance": "Educational text explaining model selection strategy..."
}
```

---

## 4. Experiment Engine

### `POST /api/experiments/run`
Train and evaluate selected algorithms.

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
  "experiment_id": "exp_abc123",
  "dataset_id": "sample_iris",
  "target_column": "species",
  "task_type": "classification",
  "test_size": 0.2,
  "random_state": 42,
  "cross_validation_folds": 5,
  "selected_features": [ ... ],
  "results": [
    {
      "model_name": "decision_tree",
      "display_name": "Decision Tree Classifier",
      "metrics": {
        "accuracy": 0.9667,
        "precision": 0.9697,
        "recall": 0.9667,
        "f1_score": 0.9665,
        "averaging_method": "weighted",
        "cv_mean": 0.9583,
        "cv_std": 0.0373,
        "classification_report": { ... }
      },
      "parameters": { "criterion": "gini", "max_depth": 5 },
      "training_time": 0.0034,
      "prediction_time": 0.0008,
      "feature_importance": { "petal_length": 0.54, "petal_width": 0.42 },
      "confusion_matrix": {
        "labels": ["setosa", "versicolor", "virginica"],
        "matrix": [[10, 0, 0], [0, 9, 1], [0, 0, 10]]
      },
      "train_score": 1.0,
      "test_score": 0.9667,
      "generalization_gap": 0.0333,
      "overfitting_risk": "Low",
      "explanation": "Decision Tree Classifier generalizes exceptionally well with consistent performance across train and test sets."
    }
  ],
  "comparison_table": [
    {
      "model_name": "decision_tree",
      "display_name": "Decision Tree Classifier",
      "rank": 1,
      "primary_metric_name": "f1_score",
      "primary_metric_value": 0.9665,
      "secondary_metric_value": 0.9667,
      "cv_mean": 0.9583,
      "cv_std": 0.0373,
      "training_time": 0.0034,
      "interpretability": "High",
      "train_test_gap": 0.0333,
      "badges": ["🏆 Top Pick", "⚡ Fastest Training", "🔍 Highly Interpretable"]
    }
  ],
  "recommendation": {
    "winning_model": "decision_tree",
    "winning_display_name": "Decision Tree Classifier",
    "priority_used": "best_performance",
    "executive_summary": "Summary...",
    "why_it_won": [ ... ],
    "trade_offs": [ ... ],
    "student_takeaway": "Student takeaway..."
  },
  "created_at": "2026-11-04T15:23:56Z"
}
```

### `POST /api/experiments/{id}/tune`
Tune hyperparameters for one algorithm from an existing experiment run.

**Request:**
```json
{
  "model_name": "decision_tree",
  "hyperparameters": {
    "max_depth": 3,
    "criterion": "entropy"
  }
}
```

**Response (200 OK):**
```json
{
  "experiment_id": "exp_abc123",
  "model_name": "decision_tree",
  "display_name": "Decision Tree Classifier",
  "applied_parameters": { "criterion": "entropy", "max_depth": 3 },
  "original_metrics": { "accuracy": 0.9667, "f1_score": 0.9665 },
  "tuned_metrics": { "accuracy": 1.0, "f1_score": 1.0 },
  "metric_differences": {
    "accuracy": { "original": 0.9667, "tuned": 1.0, "difference": 0.0333, "improved": true },
    "f1_score": { "original": 0.9665, "tuned": 1.0, "difference": 0.0335, "improved": true }
  },
  "educational_impact_analysis": "Setting `max_depth=3` altered model complexity...",
  "train_test_gap_change": "Train score: 0.9833, Test score: 1.0 (Generalization gap: -0.0167, Risk: Low)."
}
```

### `GET /api/experiments/{id}/report`
Returns printable student report for an experiment.

---

## 5. Decision Tree Explainer

- `POST /api/explain/gini`: Body: `{"class_counts": [50, 50]}` or `{"class_counts": {"class_A": 50, "class_B": 50}}`
- `POST /api/explain/entropy`: Body: `{"class_counts": [50, 50]}`
- `POST /api/explain/information-gain`:
```json
{
  "parent_counts": [50, 50],
  "children": [
    { "child_name": "Left Child", "class_counts": [45, 5] },
    { "child_name": "Right Child", "class_counts": [5, 45] }
  ],
  "criterion": "entropy"
}
```

---

## 6. Learning Lab

- `GET /api/lessons`: List summary cards for all lessons.
- `GET /api/lessons/{algorithm}`: Full educational lesson for `decision_tree`, `knn`, `logistic_regression`, `random_forest`, `linear_regression`.
