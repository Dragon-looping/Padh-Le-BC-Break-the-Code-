"""
Tests for Decision Tree Explainer endpoints (Gini, Entropy, Information Gain).
Verifies with exact, mathematically verifiable inputs and outputs.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_gini_pure_node(client):
    """A pure node (all samples in 1 class) must have Gini = 0.0."""
    res = client.post("/api/explain/gini", json={"class_counts": [100, 0]})
    assert res.status_code == 200
    data = res.json()
    assert data["total_samples"] == 100
    assert data["gini_impurity"] == 0.0
    assert "Pure Node" in data["interpretation"]

def test_gini_equal_split(client):
    """50/50 binary split has Gini = 1 - (0.5^2 + 0.5^2) = 0.5."""
    res = client.post("/api/explain/gini", json={"class_counts": {"class_A": 50, "class_B": 50}})
    assert res.status_code == 200
    data = res.json()
    assert data["total_samples"] == 100
    assert data["probabilities"]["class_A"] == 0.5
    assert data["probabilities"]["class_B"] == 0.5
    assert data["sum_squared_probabilities"] == 0.5
    assert data["gini_impurity"] == 0.5

def test_entropy_pure_node(client):
    """A pure node must have Entropy = 0.0 bits."""
    res = client.post("/api/explain/entropy", json={"class_counts": [50, 0]})
    assert res.status_code == 200
    data = res.json()
    assert data["entropy"] == 0.0
    assert "Pure Node" in data["interpretation"]

def test_entropy_equal_split(client):
    """50/50 binary split has Entropy = -(0.5*(-1) + 0.5*(-1)) = 1.0 bit."""
    res = client.post("/api/explain/entropy", json={"class_counts": [50, 50]})
    assert res.status_code == 200
    data = res.json()
    assert data["entropy"] == 1.0

def test_information_gain_calculation(client):
    """
    Parent: [50, 50] (Entropy = 1.0)
    Left Child: [40, 10] (Entropy approx 0.7219)
    Right Child: [10, 40] (Entropy approx 0.7219)
    Weighted child entropy = 0.7219
    Information Gain = 1.0 - 0.7219 = 0.2781
    """
    payload = {
        "parent_counts": [50, 50],
        "children": [
            {"child_name": "Left Child (x <= 5)", "class_counts": [40, 10]},
            {"child_name": "Right Child (x > 5)", "class_counts": [10, 40]}
        ],
        "criterion": "entropy"
    }
    res = client.post("/api/explain/information-gain", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["parent_impurity"] == 1.0
    assert abs(data["weighted_child_impurity"] - 0.7219) < 0.005
    assert abs(data["information_gain"] - 0.2781) < 0.005
    assert len(data["step_by_step_explanation"]) >= 4

def test_gini_information_gain(client):
    """Verify Information Gain computed with Gini criterion."""
    payload = {
        "parent_counts": [50, 50],
        "children": [
            {"child_name": "Left", "class_counts": [50, 0]},
            {"child_name": "Right", "class_counts": [0, 50]}
        ],
        "criterion": "gini"
    }
    res = client.post("/api/explain/information-gain", json=payload)
    assert res.status_code == 200
    data = res.json()
    # Parent Gini is 0.5, both children are 0.0 -> IG = 0.5
    assert data["parent_impurity"] == 0.5
    assert data["weighted_child_impurity"] == 0.0
    assert data["information_gain"] == 0.5
