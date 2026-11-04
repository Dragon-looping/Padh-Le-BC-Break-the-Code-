"""
Experiment routes: run multi-model training pipelines, tune hyperparameters,
inspect history, and generate comprehensive learning reports.
"""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.database.models import ExperimentModel, ModelResultModel
from app.core.dataset_manager import DatasetManager
from app.core.trainer import ModelTrainer
from app.core.comparator import ModelComparator
from app.core.recommender import ModelAdvisor
from app.core.model_registry import ModelRegistry
from app.schemas.experiment import (
    ExperimentRunRequest,
    ExperimentRunResponse,
    ExperimentSummary,
    ExperimentTuneRequest,
    ExperimentTuneResponse,
    ExperimentReportResponse,
    ModelResultDetail,
    PostTrainingAdvisor
)

router = APIRouter(prefix="/api/experiments", tags=["Experiments"])

@router.post("/run", response_model=ExperimentRunResponse, status_code=201)
def run_experiment(
    payload: ExperimentRunRequest,
    db: Session = Depends(get_db)
):
    """
    Train and evaluate multiple selected algorithms under strictly fair,
    identical training/test splits and appropriate preprocessors.
    Returns evaluated metrics, comparative rankings, and advisor insights.
    """
    record = DatasetManager.get_by_id(payload.dataset_id, db)

    return ModelTrainer.train_experiment(
        file_path=record.file_path,
        dataset_id=record.id,
        target_column=payload.target_column,
        task_type=payload.task_type,
        model_names=payload.models,
        test_size=payload.test_size,
        random_state=payload.random_state,
        cv_folds=payload.cross_validation_folds,
        priority=payload.priority,
        selected_features=payload.selected_features or record.get_selected_features(),
        db=db
    )

@router.get("", response_model=List[ExperimentSummary])
def list_experiments(db: Session = Depends(get_db)):
    """
    List historical experiment runs with high-level summaries.
    """
    records = db.query(ExperimentModel).order_by(ExperimentModel.created_at.desc()).all()
    summaries = []
    for exp in records:
        best_name = None
        best_score = None
        rec = exp.get_recommendation()
        if rec and "winning_model" in rec:
            best_name = rec["winning_display_name"]

        summaries.append(
            ExperimentSummary(
                id=exp.id,
                dataset_id=exp.dataset_id,
                target_column=exp.target_column,
                task_type=exp.task_type,
                model_count=len(exp.results),
                best_model=best_name,
                best_score=best_score,
                created_at=exp.created_at
            )
        )
    return summaries

@router.get("/{experiment_id}", response_model=ExperimentRunResponse)
def get_experiment_details(
    experiment_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve full configuration, evaluated results, and comparison leaderboard
    for an existing experiment run.
    """
    record = db.query(ExperimentModel).filter(ExperimentModel.id == experiment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found.")

    details: List[ModelResultDetail] = []
    for r in record.results:
        metrics = r.get_metrics()
        params = r.get_parameters()
        clf_data = metrics.get("confusion_matrix")
        from app.schemas.experiment import ConfusionMatrixData
        cm = ConfusionMatrixData(**clf_data) if clf_data else None

        details.append(
            ModelResultDetail(
                model_name=r.model_name,
                display_name=r.display_name,
                metrics=metrics,
                parameters=params,
                training_time=r.training_time,
                prediction_time=r.prediction_time,
                feature_importance=metrics.get("feature_importance"),
                confusion_matrix=cm,
                train_score=metrics.get("train_score"),
                test_score=metrics.get("test_score"),
                generalization_gap=metrics.get("generalization_gap"),
                overfitting_risk=metrics.get("overfitting_risk"),
                explanation=metrics.get("explanation")
            )
        )

    comp_table = ModelComparator.compare(details, task_type=record.task_type, priority=record.priority or "best_performance")

    rec_data = record.get_recommendation()
    if rec_data:
        rec = PostTrainingAdvisor(**rec_data)
    else:
        rec = ModelAdvisor.recommend_post_training(details, comp_table, record.task_type, record.priority or "best_performance")

    return ExperimentRunResponse(
        experiment_id=record.id,
        dataset_id=record.dataset_id,
        target_column=record.target_column,
        task_type=record.task_type,
        test_size=record.test_size,
        random_state=record.random_state,
        cross_validation_folds=record.cross_validation_folds,
        selected_features=record.get_selected_features(),
        results=details,
        comparison_table=comp_table,
        recommendation=rec,
        created_at=record.created_at
    )

@router.post("/{experiment_id}/tune", response_model=ExperimentTuneResponse)
def tune_experiment_model(
    experiment_id: str,
    payload: ExperimentTuneRequest,
    db: Session = Depends(get_db)
):
    """
    Experiment Studio: Retrain a model with tuned hyperparameters using the
    EXACT same split as the original experiment, displaying metric differences
    and pedagogical impact explanations.
    """
    exp_record = db.query(ExperimentModel).filter(ExperimentModel.id == experiment_id).first()
    if not exp_record:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found.")

    ds_record = DatasetManager.get_by_id(exp_record.dataset_id, db)

    return ModelTrainer.tune_hyperparameters(
        file_path=ds_record.file_path,
        experiment=exp_record,
        model_name=payload.model_name,
        hyperparameters=payload.hyperparameters,
        db=db
    )

@router.get("/{experiment_id}/report", response_model=ExperimentReportResponse)
def get_experiment_report(
    experiment_id: str,
    db: Session = Depends(get_db)
):
    """
    Generate an exhaustive, printable educational report detailing dataset structure,
    model metrics leaderboard, key trade-offs, and critical takeaways for students.
    """
    exp_response = get_experiment_details(experiment_id, db)
    ds_record = DatasetManager.get_by_id(exp_response.dataset_id, db)

    winner = exp_response.recommendation
    insights = [
        f"Evaluated {len(exp_response.results)} algorithms on a {int((1-exp_response.test_size)*100)}% train / {int(exp_response.test_size*100)}% test split.",
        f"Top algorithm: {winner.winning_display_name} under '{exp_response.recommendation.priority_used}' priority.",
        "Remember that complex models are not always better: compare their generalization gap and training speed against simpler baselines."
    ]

    return ExperimentReportResponse(
        experiment_id=exp_response.experiment_id,
        dataset_id=exp_response.dataset_id,
        generated_at=datetime.now(timezone.utc),
        task_type=exp_response.task_type,
        target_column=exp_response.target_column,
        summary=f"Educational ML Experiment Report for {ds_record.name} ({exp_response.task_type.title()}).",
        dataset_overview={
            "name": ds_record.name,
            "filename": ds_record.filename,
            "rows": ds_record.row_count,
            "columns": ds_record.column_count,
            "features_used": len(exp_response.selected_features)
        },
        model_leaderboard=exp_response.comparison_table,
        best_choice=winner,
        detailed_results=exp_response.results,
        key_insights_for_students=insights
    )
