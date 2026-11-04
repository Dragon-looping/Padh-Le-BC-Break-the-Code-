"""
Validation utilities for dataset configuration, tasks, and hyperparameters.
"""
from typing import List, Dict, Any, Optional
import pandas as pd
from fastapi import HTTPException

def validate_target_column(df: pd.DataFrame, target_column: str) -> None:
    """Ensure target column exists in DataFrame and is non-trivial."""
    if not target_column:
        raise HTTPException(status_code=400, detail="Target column must be specified.")
    if target_column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"Target column '{target_column}' does not exist in dataset. Available columns: {list(df.columns)}"
        )
    
    # Check if target column is entirely null
    if df[target_column].dropna().empty:
        raise HTTPException(status_code=400, detail=f"Target column '{target_column}' contains only missing values.")

    # Check if target column has only 1 distinct value
    unique_vals = df[target_column].dropna().nunique()
    if unique_vals < 2:
        raise HTTPException(
            status_code=400,
            detail=f"Target column '{target_column}' has only {unique_vals} unique value. Machine learning requires at least 2 distinct target values."
        )

def validate_selected_features(df: pd.DataFrame, target_column: str, selected_features: Optional[List[str]]) -> List[str]:
    """
    Validate selected feature columns and remove target column if accidentally included.
    Returns cleaned list of feature column names.
    """
    all_cols = list(df.columns)
    available_features = [col for col in all_cols if col != target_column]

    if not available_features:
        raise HTTPException(status_code=400, detail="No feature columns available after excluding the target column.")

    if not selected_features:
        return available_features

    # Filter and validate provided features
    cleaned = []
    for f in selected_features:
        if f == target_column:
            continue
        if f not in df.columns:
            raise HTTPException(status_code=400, detail=f"Selected feature '{f}' does not exist in dataset.")
        cleaned.append(f)

    if not cleaned:
        raise HTTPException(
            status_code=400,
            detail="At least one valid feature column must be selected (target column cannot be its own feature)."
        )

    return cleaned

def validate_task_type(task_type: str) -> str:
    """Validate task type string."""
    normalized = task_type.lower().strip()
    if normalized not in ("classification", "regression"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid task_type '{task_type}'. Supported task types are 'classification' and 'regression'."
        )
    return normalized
