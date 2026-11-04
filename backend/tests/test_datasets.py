"""
Tests for dataset upload, validation, profiling, and configuration.
"""
import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_list_datasets(client):
    """Verify built-in sample datasets are seeded and returned."""
    res = client.get("/api/datasets")
    assert res.status_code == 200
    datasets = res.json()
    assert len(datasets) >= 4
    sample_ids = [d["id"] for d in datasets]
    assert "sample_iris" in sample_ids

def test_upload_valid_csv(client):
    """Upload a synthetic CSV and verify response metadata."""
    csv_content = "age,salary,purchased\n25,50000,0\n30,60000,1\n35,75000,1\n40,80000,0\n45,95000,1\n"
    file_bytes = io.BytesIO(csv_content.encode("utf-8"))
    files = {"file": ("test_customers.csv", file_bytes, "text/csv")}

    res = client.post("/api/datasets/upload", files=files)
    assert res.status_code == 201
    data = res.json()
    assert "dataset_id" in data
    assert data["row_count"] == 5
    assert data["column_count"] == 3
    assert data["status"] == "uploaded"

def test_reject_empty_csv(client):
    """Uploading an empty CSV should return 400 error."""
    files = {"file": ("empty.csv", io.BytesIO(b""), "text/csv")}
    res = client.post("/api/datasets/upload", files=files)
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()

def test_reject_non_csv(client):
    """Uploading a non-csv file extension should be rejected."""
    files = {"file": ("image.png", io.BytesIO(b"dummy_bytes"), "image/png")}
    res = client.post("/api/datasets/upload", files=files)
    assert res.status_code == 400
    assert "csv" in res.json()["detail"].lower()

def test_dataset_profiling(client):
    """Verify profile calculation on sample_iris."""
    res = client.get("/api/datasets/sample_iris/profile")
    assert res.status_code == 200
    profile = res.json()
    assert profile["row_count"] == 150
    assert profile["column_count"] == 5
    assert len(profile["columns"]) == 5
    assert len(profile["numerical_stats"]) == 4
    assert len(profile["sample_preview"]) > 0
    assert "species" in profile["target_candidates"]

def test_target_configuration_and_task_detection(client):
    """Verify explicit target configuration and task detection validation."""
    payload = {
        "target_column": "species",
        "task_type": "classification",
        "selected_features": ["sepal_length", "sepal_width", "petal_length", "petal_width"]
    }
    res = client.post("/api/datasets/sample_iris/configure", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["target_column"] == "species"
    assert data["task_type"] == "classification"
    assert data["validation_report"]["is_valid"] is True
    assert data["validation_report"]["detected_task"] == "classification"

def test_invalid_task_configuration_rejected(client):
    """Setting regression on text categorical column must fail."""
    payload = {
        "target_column": "species",
        "task_type": "regression"
    }
    res = client.post("/api/datasets/sample_iris/configure", json=payload)
    assert res.status_code == 400
    assert "regression" in res.json()["detail"].lower()
