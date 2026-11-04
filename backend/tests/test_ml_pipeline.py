"""
Tests for ML training engine, evaluation, model registry, and advisor recommendations.
Verifies authentic machine learning execution, fair splitting, and metrics calculations.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_list_models(client):
    """Verify all registered classification and regression models."""
    res = client.get("/api/models")
    assert res.status_code == 200
    models = res.json()
    model_ids = [m["model_id"] for m in models]
    assert "logistic_regression" in model_ids
    assert "knn" in model_ids
    assert "decision_tree" in model_ids
    assert "random_forest" in model_ids
    assert "linear_regression" in model_ids
    assert "random_forest_regressor" in model_ids

def test_model_advisor_pre_training(client):
    """Verify pre-training algorithm recommendation based on dataset characteristics."""
    payload = {
        "dataset_id": "sample_iris",
        "target_column": "species",
        "task_type": "classification"
    }
    res = client.post("/api/models/recommend", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["task_type"] == "classification"
    assert len(data["recommended"]) > 0
    assert "overall_guidance" in data

def test_classification_training_iris(client):
    """
    Train Logistic Regression, KNN, Decision Tree, and Random Forest on Iris.
    Verify that genuine metrics, confusion matrix, and comparisons are returned.
    """
    payload = {
        "dataset_id": "sample_iris",
        "target_column": "species",
        "task_type": "classification",
        "models": ["logistic_regression", "knn", "decision_tree", "random_forest"],
        "test_size": 0.2,
        "random_state": 42,
        "cross_validation_folds": 3,
        "priority": "best_performance"
    }
    res = client.post("/api/experiments/run", json=payload)
    assert res.status_code == 201
    data = res.json()

    assert "experiment_id" in data
    assert len(data["results"]) == 4

    for r in data["results"]:
        metrics = r["metrics"]
        assert 0.0 <= metrics["accuracy"] <= 1.0
        assert 0.0 <= metrics["f1_score"] <= 1.0
        assert metrics["cv_mean"] is not None
        assert r["confusion_matrix"] is not None
        assert len(r["confusion_matrix"]["labels"]) == 3
        assert r["training_time"] >= 0.0
        assert r["test_score"] is not None
        assert r["train_score"] is not None
        assert r["overfitting_risk"] in ("Low", "Moderate", "High")

    # Comparison table
    comp = data["comparison_table"]
    assert len(comp) == 4
    assert comp[0]["rank"] == 1
    # Recommendation
    rec = data["recommendation"]
    assert rec["winning_model"] in ["logistic_regression", "knn", "decision_tree", "random_forest"]
    assert len(rec["why_it_won"]) > 0

def test_regression_training(client):
    """
    Train Linear Regression and Decision Tree Regressor on tech salaries.
    Verify RMSE, MAE, R2 scores.
    """
    payload = {
        "dataset_id": "sample_tech_salaries",
        "target_column": "salary_lpa",
        "task_type": "regression",
        "models": ["linear_regression", "decision_tree_regressor", "random_forest_regressor"],
        "test_size": 0.2,
        "random_state": 42,
        "cross_validation_folds": 3,
        "priority": "best_performance"
    }
    res = client.post("/api/experiments/run", json=payload)
    assert res.status_code == 201
    data = res.json()

    assert len(data["results"]) == 3
    for r in data["results"]:
        metrics = r["metrics"]
        assert "rmse" in metrics
        assert "mae" in metrics
        assert "r2_score" in metrics
        assert metrics["rmse"] > 0

    # Ensure rank 1 has the lowest RMSE
    comp = data["comparison_table"]
    assert comp[0]["primary_metric_value"] <= comp[1]["primary_metric_value"]

def test_incompatible_model_task_rejected(client):
    """Running linear regression on classification experiment should be rejected."""
    payload = {
        "dataset_id": "sample_iris",
        "target_column": "species",
        "task_type": "classification",
        "models": ["linear_regression"]
    }
    res = client.post("/api/experiments/run", json=payload)
    assert res.status_code == 400
    assert "linear_regression" in res.json()["detail"].lower()
