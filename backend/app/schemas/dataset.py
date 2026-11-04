"""
Pydantic schemas for dataset operations.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class DatasetUploadResponse(BaseModel):
    dataset_id: str
    name: str
    filename: str
    row_count: int
    column_count: int
    status: str = "uploaded"
    message: str = "Dataset successfully uploaded and validated."

class DatasetSummary(BaseModel):
    id: str
    name: str
    filename: str
    row_count: int
    column_count: int
    target_column: Optional[str] = None
    task_type: Optional[str] = None
    is_sample: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ColumnInfo(BaseModel):
    name: str
    data_type: str  # numerical | categorical | text | identifier
    python_type: str
    missing_count: int
    missing_percentage: float
    unique_count: int
    is_potential_target: bool = False
    is_potential_identifier: bool = False
    warning: Optional[str] = None

class NumericalStat(BaseModel):
    column: str
    count: int
    mean: float
    std: float
    min: float
    q25: float
    median: float
    q75: float
    max: float

class CategoricalStat(BaseModel):
    column: str
    unique_count: int
    top_value: Optional[str] = None
    top_frequency: Optional[int] = None
    value_counts: Dict[str, int] = Field(default_factory=dict)

class ClassDistribution(BaseModel):
    target_column: str
    classes: Dict[str, int]
    imbalance_ratio: float
    is_imbalanced: bool
    warning: Optional[str] = None

class DatasetProfileResponse(BaseModel):
    dataset_id: str
    name: str
    row_count: int
    column_count: int
    duplicate_rows: int
    columns: List[ColumnInfo]
    numerical_stats: List[NumericalStat]
    categorical_stats: List[CategoricalStat]
    sample_preview: List[Dict[str, Any]]
    target_candidates: List[str]
    target_column: Optional[str] = None
    task_type: Optional[str] = None
    class_distribution: Optional[ClassDistribution] = None
    correlations: Optional[Dict[str, Dict[str, float]]] = None

class DatasetConfigureRequest(BaseModel):
    target_column: str
    task_type: str = Field(..., description="classification or regression")
    selected_features: Optional[List[str]] = Field(None, description="Optional list of feature columns to include")

class ValidationReport(BaseModel):
    is_valid: bool
    detected_task: str
    recommended_task: str
    warnings: List[str] = Field(default_factory=list)
    target_unique_count: int
    target_data_type: str

class DatasetConfigureResponse(BaseModel):
    dataset_id: str
    target_column: str
    task_type: str
    selected_features: List[str]
    validation_report: ValidationReport
    message: str = "Dataset target and task configuration updated successfully."
