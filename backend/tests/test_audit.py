"""
Comprehensive Backend Technical Audit Tests for PADH LE BC.
Covers all audit phases: edge cases, data leakage checks, model comparisons,
explainer math, parameter boundary validation, and database integrity.
"""
import io
import pytest
import pandas as pd
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

# ================= PHASE 2: APPLICATION STARTUP & DOCS =================

def test_audit_docs_and_health(client):
    """Verify health endpoint and OpenAPI schema registration."""
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    health_data = health_res.json()
    assert health_data["status"] == "healthy"
    assert health_data["app"] == "PADH LE BC (Break the Code)"
    assert health_data["version"] == "1.0.0"

    docs_res = client.get("/openapi.json")
    assert docs_res.status_code == 200
    paths = docs_res.json()["paths"]
    assert "/api/health" in paths
    assert "/api/datasets/upload" in paths
    assert "/api/datasets/{dataset_id}/profile" in paths
    assert "/api/datasets/{dataset_id}/configure" in paths
    assert "/api/experiments/run" in paths
    assert "/api/experiments/{experiment_id}/tune" in paths
    assert "/api/explain/gini" in paths
    assert "/api/explain/entropy" in paths
    assert "/api/explain/information-gain" in paths
    assert "/api/lessons" in paths

# ================= PHASE 3: DATASET EDGE CASES =================

def test_audit_dataset_corrupted_csv(client):
    """Corrupted CSV should return 400 error."""
    corrupted_data = b"\x00\x01\x02\x03\xff\xfe\xfd\x00\x00\x00"
    files = {"file": ("corrupted.csv", io.BytesIO(corrupted_data), "text/csv")}
    res = client.post("/api/datasets/upload", files=files)
    assert res.status_code == 400

def test_audit_dataset_too_few_rows(client):
    """Dataset with only 2 rows (<5) should be rejected for lack of training data."""
    csv_text = "feature1,feature2,target\n1.0,2.0,0\n3.0,4.0,1\n"
    files = {"file": ("tiny.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    res = client.post("/api/datasets/upload", files=files)
    assert res.status_code == 400
    assert "at least 5 rows" in res.json()["detail"].lower()

def test_audit_dataset_single_column(client):
    """Dataset with only 1 column should be rejected."""
    csv_text = "target\n0\n1\n0\n1\n0\n1\n"
    files = {"file": ("single_col.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    res = client.post("/api/datasets/upload", files=files)
    assert res.status_code == 400
    assert "at least 2 columns" in res.json()["detail"].lower()

def test_audit_dataset_single_target_class(client):
    """Configuring a target with only 1 distinct class must be rejected."""
    csv_text = "feature1,feature2,target\n1,2,A\n3,4,A\n5,6,A\n7,8,A\n9,10,A\n"
    files = {"file": ("one_class.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    up_res = client.post("/api/datasets/upload", files=files)
    assert up_res.status_code == 201
    ds_id = up_res.json()["dataset_id"]

    cfg_payload = {"target_column": "target", "task_type": "classification"}
    cfg_res = client.post(f"/api/datasets/{ds_id}/configure", json=cfg_payload)
    assert cfg_res.status_code == 400
    assert "at least 2 distinct target values" in cfg_res.json()["detail"].lower()

def test_audit_dataset_with_missing_and_duplicates(client):
    """Dataset with missing values and duplicates must profile correctly."""
    csv_text = (
        "id,score,category,target\n"
        "1,85.5,cat_A,pass\n"
        "2,,cat_B,fail\n"
        "3,90.0,,pass\n"
        "4,85.5,cat_A,pass\n"
        "5,70.0,cat_B,fail\n"
        "5,70.0,cat_B,fail\n"  # exact duplicate of row 5
    )
    files = {"file": ("dirty_data.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    up_res = client.post("/api/datasets/upload", files=files)
    assert up_res.status_code == 201
    ds_id = up_res.json()["dataset_id"]

    prof_res = client.get(f"/api/datasets/{ds_id}/profile?target_column=target&task_type=classification")
    assert prof_res.status_code == 200
    prof = prof_res.json()
    assert prof["row_count"] == 6
    assert prof["duplicate_rows"] == 1  # 1 duplicate row
    assert any(col["missing_count"] > 0 for col in prof["columns"])
    assert prof["class_distribution"]["classes"] == {"pass": 3, "fail": 3}

# ================= PHASE 4 & 5: ML ENGINE & DATA LEAKAGE AUDIT =================

def test_audit_all_five_classification_models(client):
    """
    Train all 5 classification models on Iris.
    Verify fit, predictions, metrics, confusion matrix, and feature importances.
    """
    models = ["logistic_regression", "knn", "decision_tree", "random_forest", "gradient_boosting"]
    payload = {
        "dataset_id": "sample_iris",
        "target_column": "species",
        "task_type": "classification",
        "models": models,
        "test_size": 0.2,
        "random_state": 42,
        "cross_validation_folds": 4,
        "priority": "best_performance"
    }
    res = client.post("/api/experiments/run", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert len(data["results"]) == 5

    for r in data["results"]:
        assert r["model_name"] in models
        metrics = r["metrics"]
        assert 0.0 <= metrics["accuracy"] <= 1.0
        assert 0.0 <= metrics["f1_score"] <= 1.0
        assert metrics["cv_mean"] is not None
        assert r["confusion_matrix"] is not None
        assert len(r["confusion_matrix"]["labels"]) == 3
        assert r["training_time"] > 0.0

def test_audit_all_four_regression_models(client):
    """
    Train all 4 regression models on tech salaries.
    Verify MAE, MSE, RMSE, R2, and rankings.
    """
    models = ["linear_regression", "decision_tree_regressor", "random_forest_regressor", "gradient_boosting_regressor"]
    payload = {
        "dataset_id": "sample_tech_salaries",
        "target_column": "salary_lpa",
        "task_type": "regression",
        "models": models,
        "test_size": 0.2,
        "random_state": 42,
        "cross_validation_folds": 3,
        "priority": "best_performance"
    }
    res = client.post("/api/experiments/run", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert len(data["results"]) == 4

    for r in data["results"]:
        assert r["model_name"] in models
        m = r["metrics"]
        assert m["rmse"] > 0.0
        assert m["mae"] > 0.0
        assert -10.0 <= m["r2_score"] <= 1.0

def test_audit_unseen_categories_handling(client):
    """
    Data leakage / Robustness check:
    Verify that OneHotEncoder with handle_unknown='ignore' successfully evaluates
    when test data contains categories not seen in training data.
    """
    csv_text = (
        "color,size,price\n"
        "red,small,10.0\n"
        "red,medium,15.0\n"
        "blue,small,12.0\n"
        "blue,large,20.0\n"
        "red,large,18.0\n"
        "green,medium,16.0\n"
        "blue,medium,14.0\n"
        "red,small,11.0\n"
        "yellow,large,25.0\n"  # rare category
        "purple,small,30.0\n"  # rare category
    )
    files = {"file": ("colors.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    up_res = client.post("/api/datasets/upload", files=files)
    assert up_res.status_code == 201
    ds_id = up_res.json()["dataset_id"]

    payload = {
        "dataset_id": ds_id,
        "target_column": "price",
        "task_type": "regression",
        "models": ["linear_regression", "decision_tree_regressor"],
        "test_size": 0.3,
        "random_state": 42
    }
    res = client.post("/api/experiments/run", json=payload)
    assert res.status_code == 201
    assert len(res.json()["results"]) == 2

# ================= PHASE 7: MODEL COMPARISON & PRIORITIES =================

def test_audit_model_comparison_priorities(client):
    """
    Verify ranking adjusts according to selected student priority:
    - interpretability: Decision Tree / Logistic Regression gets priority
    - faster_training: fastest model gets rank 1
    """
    payload_interp = {
        "dataset_id": "sample_iris",
        "target_column": "species",
        "task_type": "classification",
        "models": ["random_forest", "decision_tree"],
        "test_size": 0.2,
        "priority": "interpretability"
    }
    res_interp = client.post("/api/experiments/run", json=payload_interp)
    assert res_interp.status_code == 201
    comp_interp = res_interp.json()["comparison_table"]
    # Decision tree has High interpretability, Random Forest has Moderate
    assert comp_interp[0]["model_name"] == "decision_tree"
    assert any("Highly Interpretable" in b for b in comp_interp[0]["badges"])

    payload_speed = {
        "dataset_id": "sample_iris",
        "target_column": "species",
        "task_type": "classification",
        "models": ["random_forest", "decision_tree"],
        "test_size": 0.2,
        "priority": "faster_training"
    }
    res_speed = client.post("/api/experiments/run", json=payload_speed)
    assert res_speed.status_code == 201
    comp_speed = res_speed.json()["comparison_table"]
    # Fastest model ranks first
    assert comp_speed[0]["training_time"] <= comp_speed[1]["training_time"]

# ================= PHASE 8: DECISION TREE EXPLAINER MATH =================

def test_audit_explainer_hand_verifiable_math(client):
    """
    Mathematically verifiable audit:
    Class counts: [5, 5]
    Gini = 1 - (0.5^2 + 0.5^2) = 0.5
    Entropy = -(0.5 * log2(0.5) + 0.5 * log2(0.5)) = 1.0
    """
    g_res = client.post("/api/explain/gini", json={"class_counts": [5, 5]})
    assert g_res.status_code == 200
    assert g_res.json()["gini_impurity"] == 0.5

    e_res = client.post("/api/explain/entropy", json={"class_counts": [5, 5]})
    assert e_res.status_code == 200
    assert e_res.json()["entropy"] == 1.0

def test_audit_explainer_multi_class(client):
    """
    Three equal classes: [10, 10, 10]
    p = 1/3 for each class.
    Gini = 1 - 3 * (1/3)^2 = 1 - 3/9 = 1 - 0.3333 = 0.6667
    """
    g_res = client.post("/api/explain/gini", json={"class_counts": [10, 10, 10]})
    assert g_res.status_code == 200
    assert abs(g_res.json()["gini_impurity"] - 0.6667) < 0.001

def test_audit_explainer_negative_and_empty_rejected(client):
    """Negative or empty counts must be rejected with 400 error."""
    # Negative counts
    r1 = client.post("/api/explain/gini", json={"class_counts": [-5, 10]})
    assert r1.status_code == 400
    assert "negative" in r1.json()["detail"].lower()

    # Empty counts
    r2 = client.post("/api/explain/entropy", json={"class_counts": []})
    assert r2.status_code == 400
    assert "empty" in r2.json()["detail"].lower()

# ================= PHASE 9: EXPERIMENT STUDIO HYPERPARAMETERS =================

def test_audit_hyperparameter_boundary_and_validation(client):
    """
    Verify hyperparameter boundary validation:
    - Unsupported parameter name rejected
    - Out of bounds value rejected
    - Allowed options enforced
    """
    # 1. Run baseline
    base_res = client.post("/api/experiments/run", json={
        "dataset_id": "sample_iris",
        "target_column": "species",
        "task_type": "classification",
        "models": ["decision_tree"],
        "test_size": 0.25
    })
    exp_id = base_res.json()["experiment_id"]

    # 2. Unsupported parameter name
    r_unsupported = client.post(f"/api/experiments/{exp_id}/tune", json={
        "model_name": "decision_tree",
        "hyperparameters": {"bogus_parameter_name": 123}
    })
    assert r_unsupported.status_code == 400
    assert "unsupported hyperparameter" in r_unsupported.json()["detail"].lower()

    # 3. Out of bounds min_value (max_depth < 1)
    r_bounds = client.post(f"/api/experiments/{exp_id}/tune", json={
        "model_name": "decision_tree",
        "hyperparameters": {"max_depth": 0}
    })
    assert r_bounds.status_code == 400
    assert "less than minimum allowed" in r_bounds.json()["detail"].lower()

    # 4. Invalid option
    r_option = client.post(f"/api/experiments/{exp_id}/tune", json={
        "model_name": "decision_tree",
        "hyperparameters": {"criterion": "unsupported_criterion"}
    })
    assert r_option.status_code == 400
    assert "allowed options" in r_option.json()["detail"].lower()

# ================= PHASE 10: LEARNING LAB LESSONS =================

def test_audit_all_five_lessons_integrity(client):
    """Verify all 5 JSON lessons load with required educational sections."""
    lessons_list = client.get("/api/lessons").json()
    assert len(lessons_list) >= 5
    required_ids = ["decision_tree", "knn", "logistic_regression", "random_forest", "linear_regression"]

    for lid in required_ids:
        res = client.get(f"/api/lessons/{lid}")
        assert res.status_code == 200
        l = res.json()
        assert l["id"] == lid
        assert len(l["introduction"]) > 20
        assert len(l["why_used"]) >= 3
        assert len(l["important_formulas"]) >= 2
        assert "step_by_step_example" in l
        assert len(l["advantages"]) >= 3
        assert len(l["disadvantages"]) >= 3
        assert len(l["when_to_use"]) >= 2
        assert len(l["when_to_avoid"]) >= 2
        assert len(l["comparison_with_related"]) >= 1

# ================= PHASE 11: DATABASE INTEGRITY & CASCADE =================

def test_audit_database_integrity_and_persistence(client):
    """Verify that experiments and model results persist and link to datasets."""
    from app.database.db import SessionLocal
    from app.database.models import DatasetModel, ExperimentModel, ModelResultModel

    db = SessionLocal()
    try:
        exp_count = db.query(ExperimentModel).count()
        assert exp_count > 0

        # Retrieve an experiment with results
        exp = db.query(ExperimentModel).first()
        assert exp is not None
        assert exp.dataset is not None
        assert len(exp.results) > 0

        # Verify JSON deserialization helper
        first_res = exp.results[0]
        metrics = first_res.get_metrics()
        assert isinstance(metrics, dict)
        assert len(metrics) > 0
    finally:
        db.close()
