"""
Model routes: registry inspection and algorithm advisor recommendations.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.core.dataset_manager import DatasetManager
from app.core.model_registry import ModelRegistry
from app.core.recommender import ModelAdvisor
from app.schemas.model import (
    ModelInfo,
    ModelRecommendationRequest,
    ModelRecommendationResponse
)

router = APIRouter(prefix="/api/models", tags=["Models"])

@router.get("", response_model=List[ModelInfo])
def list_models(task_type: Optional[str] = None):
    """
    List registered algorithms with hyperparameter specifications,
    interpretability levels, scaling requirements, and descriptions.
    Optionally filter by task_type ('classification' or 'regression').
    """
    return ModelRegistry.list_models(task_type=task_type)

@router.post("/recommend", response_model=ModelRecommendationResponse)
def recommend_models(
    payload: ModelRecommendationRequest,
    db: Session = Depends(get_db)
):
    """
    Model Advisor (Pre-Training): Inspects dataset characteristics (sample size,
    feature dimensions, types, missing values, class imbalance) and suggests
    candidate algorithms, algorithms to consider, and caveats.
    """
    record = DatasetManager.get_by_id(payload.dataset_id, db)
    effective_target = payload.target_column or record.target_column
    effective_task = payload.task_type or record.task_type

    return ModelAdvisor.recommend_pre_training(
        file_path=record.file_path,
        dataset_id=record.id,
        target_column=effective_target,
        task_type=effective_task
    )
