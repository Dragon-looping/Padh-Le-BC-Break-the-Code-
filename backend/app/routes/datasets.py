"""
Dataset routes: upload, list, profile, and configure dataset metadata.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.database.models import DatasetModel
from app.schemas.dataset import (
    DatasetUploadResponse,
    DatasetSummary,
    DatasetProfileResponse,
    DatasetConfigureRequest,
    DatasetConfigureResponse
)
from app.core.dataset_manager import DatasetManager
from app.core.dataset_analyzer import DatasetAnalyzer
from app.core.task_detector import TaskDetector
from app.utils.file_utils import load_csv_safely
from app.utils.validators import validate_target_column

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])

@router.post("/upload", response_model=DatasetUploadResponse, status_code=201)
def upload_dataset(
    file: UploadFile = File(..., description="CSV file to upload and profile"),
    db: Session = Depends(get_db)
):
    """
    Upload a CSV dataset. Validates extension, size, and structure,
    stores the file in datasets/uploads/, and records metadata in SQLite.
    """
    record = DatasetManager.save_upload(file, db)
    return DatasetUploadResponse(
        dataset_id=record.id,
        name=record.name,
        filename=record.filename,
        row_count=record.row_count,
        column_count=record.column_count,
        status="uploaded",
        message="Dataset uploaded, validated, and registered successfully."
    )

@router.get("", response_model=List[DatasetSummary])
def list_datasets(db: Session = Depends(get_db)):
    """
    List all available datasets, including both built-in sample datasets and user uploads.
    """
    datasets = DatasetManager.list_all(db)
    return [DatasetSummary.model_validate(d) for d in datasets]

@router.get("/{dataset_id}/profile", response_model=DatasetProfileResponse)
def get_dataset_profile(
    dataset_id: str,
    target_column: Optional[str] = None,
    task_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Analyze dataset structure: columns, types, missing values, duplicates,
    descriptive statistics, class distribution, correlation matrix, and preview records.
    """
    record = DatasetManager.get_by_id(dataset_id, db)
    effective_target = target_column or record.target_column
    effective_task = task_type or record.task_type

    return DatasetAnalyzer.profile_dataset(
        file_path=record.file_path,
        dataset_id=record.id,
        name=record.name,
        target_column=effective_target,
        task_type=effective_task
    )

@router.post("/{dataset_id}/configure", response_model=DatasetConfigureResponse)
def configure_dataset(
    dataset_id: str,
    payload: DatasetConfigureRequest,
    db: Session = Depends(get_db)
):
    """
    Explicitly set the target column, task type, and feature columns for a dataset.
    Validates compatibility using the TaskDetector.
    """
    record = DatasetManager.get_by_id(dataset_id, db)
    df = load_csv_safely(record.file_path)

    # Validate target column existence and properties
    validate_target_column(df, payload.target_column)

    # Validate features if provided
    selected_features = payload.selected_features
    if selected_features is not None:
        clean_features = [f for f in selected_features if f in df.columns and f != payload.target_column]
        if not clean_features:
            raise HTTPException(
                status_code=400,
                detail="At least one valid feature column must be selected (target column cannot be a feature)."
            )
    else:
        clean_features = [c for c in df.columns if c != payload.target_column]

    # Validate task with task detector
    validation_report = TaskDetector.detect_and_validate(
        df=df,
        target_column=payload.target_column,
        user_task_type=payload.task_type
    )

    if not validation_report.is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"Task configuration error: {'; '.join(validation_report.warnings)}"
        )

    # Update database record
    record.target_column = payload.target_column
    record.task_type = payload.task_type
    record.set_selected_features(clean_features)
    db.commit()
    db.refresh(record)

    return DatasetConfigureResponse(
        dataset_id=record.id,
        target_column=record.target_column,
        task_type=record.task_type,
        selected_features=clean_features,
        validation_report=validation_report,
        message="Dataset target, task type, and feature configurations successfully saved."
    )
