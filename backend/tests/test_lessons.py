"""
Tests for Learning Lab lesson retrieval endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_list_lessons(client):
    """Verify all 5 core lessons are returned with summaries."""
    res = client.get("/api/lessons")
    assert res.status_code == 200
    lessons = res.json()
    assert len(lessons) >= 5
    ids = [l["id"] for l in lessons]
    assert "decision_tree" in ids
    assert "knn" in ids
    assert "logistic_regression" in ids
    assert "random_forest" in ids
    assert "linear_regression" in ids

def test_get_individual_lesson(client):
    """Verify comprehensive lesson content for decision_tree."""
    res = client.get("/api/lessons/decision_tree")
    assert res.status_code == 200
    lesson = res.json()
    assert lesson["id"] == "decision_tree"
    assert "introduction" in lesson
    assert "why_used" in lesson
    assert "how_it_works" in lesson
    assert "important_formulas" in lesson
    assert len(lesson["important_formulas"]) >= 3
    assert "step_by_step_example" in lesson
    assert "advantages" in lesson
    assert "disadvantages" in lesson
    assert "when_to_use" in lesson
    assert "when_to_avoid" in lesson
    assert "comparison_with_related" in lesson

def test_get_nonexistent_lesson(client):
    """Requesting an unknown algorithm should return 404 with available options."""
    res = client.get("/api/lessons/quantum_neural_net")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()
