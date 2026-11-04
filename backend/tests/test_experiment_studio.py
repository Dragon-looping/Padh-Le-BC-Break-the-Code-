"""
Tests for Experiment Studio, hyperparameter tuning, and printable report generation.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_tune_hyperparameters_and_reports(client):
    """
    1. Run initial experiment on Iris.
    2. Tune Decision Tree hyperparameters (max_depth=2).
    3. Verify metric differences and educational feedback.
    4. Retrieve experiment details and comprehensive report.
    """
    # 1. Run baseline experiment
    run_payload = {
        "dataset_id": "sample_iris",
        "target_column": "species",
        "task_type": "classification",
        "models": ["decision_tree"],
        "test_size": 0.25,
        "random_state": 42
    }
    run_res = client.post("/api/experiments/run", json=run_payload)
    assert run_res.status_code == 201
    exp_data = run_res.json()
    exp_id = exp_data["experiment_id"]

    # 2. Tune Decision Tree max_depth
    tune_payload = {
        "model_name": "decision_tree",
        "hyperparameters": {
            "max_depth": 2,
            "criterion": "gini"
        }
    }
    tune_res = client.post(f"/api/experiments/{exp_id}/tune", json=tune_payload)
    assert tune_res.status_code == 200
    tune_data = tune_res.json()
    assert tune_data["model_name"] == "decision_tree"
    assert tune_data["applied_parameters"]["max_depth"] == 2
    assert "accuracy" in tune_data["metric_differences"]
    assert len(tune_data["educational_impact_analysis"]) > 10

    # 3. Retrieve experiment detail
    detail_res = client.get(f"/api/experiments/{exp_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["experiment_id"] == exp_id

    # 4. Retrieve experiment report
    report_res = client.get(f"/api/experiments/{exp_id}/report")
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert report_data["experiment_id"] == exp_id
    assert "model_leaderboard" in report_data
    assert len(report_data["key_insights_for_students"]) > 0

def test_tune_invalid_experiment_id(client):
    """Tuning a nonexistent experiment should return 404."""
    res = client.post("/api/experiments/nonexistent_id/tune", json={"model_name": "decision_tree", "hyperparameters": {}})
    assert res.status_code == 404
