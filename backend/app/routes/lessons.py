"""
Learning Lab routes: serving structured educational JSON lessons for machine learning algorithms.
"""
import os
import json
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/lessons", tags=["Learning Lab"])

LESSONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "lessons"))

@router.get("", response_model=List[Dict[str, Any]])
def list_lessons():
    """
    List all available educational lessons with high-level summaries and supported task types.
    """
    if not os.path.exists(LESSONS_DIR):
        return []

    lessons_summary = []
    for file_name in sorted(os.listdir(LESSONS_DIR)):
        if file_name.endswith(".json"):
            file_path = os.path.join(LESSONS_DIR, file_name)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    lessons_summary.append({
                        "id": data.get("id"),
                        "name": data.get("name"),
                        "task_types": data.get("task_types", []),
                        "tagline": data.get("tagline", ""),
                        "introduction_snippet": data.get("introduction", "")[:180] + "..."
                    })
            except Exception:
                continue

    return lessons_summary

@router.get("/{algorithm}", response_model=Dict[str, Any])
def get_lesson(algorithm: str):
    """
    Retrieve exhaustive educational content for an algorithm: intuition,
    worked examples, LaTeX mathematical formulas, advantages/disadvantages,
    and decision trade-offs.
    """
    clean_id = algorithm.lower().replace("-", "_").strip()
    file_path = os.path.join(LESSONS_DIR, f"{clean_id}.json")

    if not os.path.isfile(file_path):
        available = [f.replace(".json", "") for f in os.listdir(LESSONS_DIR) if f.endswith(".json")]
        raise HTTPException(
            status_code=404,
            detail=f"Lesson for algorithm '{algorithm}' not found. Available lessons: {available}"
        )

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read lesson file: {str(e)}")
