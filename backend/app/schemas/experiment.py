"""
Pydantic schemas for experiments, training runs, tuning, and comparisons.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class ExperimentRunRequest(BaseModel):
    dataset_id: str
    target_column: str
    task_type: str = Field(..., description="'classification' or 'regression'")
    models: List[str] = Field(..., min_length=1, description="List of algorithm IDs to train and compare")
    test_size: float = Field(0.2, ge=0.05, le=0.5, description="Proportion of the dataset to include in the test split")
    random_state: int = Field(42, description="Random seed for reproducibility")
    cross_validation_folds: int = Field(5, ge=2, le=10, description="Number of cross-validation folds on training data")
    priority: str = Field("best_performance", description="'best_performance', 'interpretability', 'faster_training', or 'simpler_model'")
    selected_features: Optional[List[str]] = Field(None, description="Optional feature subset; if omitted, all non-target columns are used")

class ConfusionMatrixData(BaseModel):
    labels: List[str]
    matrix: List[List[int]]

class ModelResultDetail(BaseModel):
    model_name: str
    display_name: str
    metrics: Dict[str, Any]
    parameters: Dict[str, Any]
    training_time: float
    prediction_time: Optional[float] = None
    feature_importance: Optional[Dict[str, float]] = None
    confusion_matrix: Optional[ConfusionMatrixData] = None
    train_score: Optional[float] = None
    test_score: Optional[float] = None
    generalization_gap: Optional[float] = None
    overfitting_risk: Optional[str] = None  # Low | Moderate | High
    explanation: Optional[str] = None

class ComparisonRow(BaseModel):
    model_name: str
    display_name: str
    rank: int
    primary_metric_name: str
    primary_metric_value: float
    secondary_metric_value: Optional[float] = None
    cv_mean: Optional[float] = None
    cv_std: Optional[float] = None
    training_time: float
    interpretability: str
    train_test_gap: Optional[float] = None
    badges: List[str] = Field(default_factory=list)

class PostTrainingAdvisor(BaseModel):
    winning_model: str
    winning_display_name: str
    priority_used: str
    executive_summary: str
    why_it_won: List[str]
    trade_offs: List[str]
    student_takeaway: str

class ExperimentRunResponse(BaseModel):
    experiment_id: str
    dataset_id: str
    target_column: str
    task_type: str
    test_size: float
    random_state: int
    cross_validation_folds: int
    selected_features: List[str]
    results: List[ModelResultDetail]
    comparison_table: List[ComparisonRow]
    recommendation: PostTrainingAdvisor
    created_at: datetime

class ExperimentSummary(BaseModel):
    id: str
    dataset_id: str
    target_column: str
    task_type: str
    model_count: int
    best_model: Optional[str] = None
    best_score: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ExperimentTuneRequest(BaseModel):
    model_name: str
    hyperparameters: Dict[str, Any]

class MetricDifference(BaseModel):
    original: float
    tuned: float
    difference: float
    improved: bool

class ExperimentTuneResponse(BaseModel):
    experiment_id: str
    model_name: str
    display_name: str
    applied_parameters: Dict[str, Any]
    original_metrics: Dict[str, Any]
    tuned_metrics: Dict[str, Any]
    metric_differences: Dict[str, MetricDifference]
    educational_impact_analysis: str
    train_test_gap_change: Optional[str] = None

class ExperimentReportResponse(BaseModel):
    experiment_id: str
    dataset_id: str
    generated_at: datetime
    task_type: str
    target_column: str
    summary: str
    dataset_overview: Dict[str, Any]
    model_leaderboard: List[ComparisonRow]
    best_choice: PostTrainingAdvisor
    detailed_results: List[ModelResultDetail]
    key_insights_for_students: List[str]
