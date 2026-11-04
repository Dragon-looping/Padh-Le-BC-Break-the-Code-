"""
Pydantic schemas for Model Registry and Advisor recommendations.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class HyperparameterSpec(BaseModel):
    name: str
    type: str  # int, float, str, bool
    default: Any
    options: Optional[List[Any]] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    description: str

class ModelInfo(BaseModel):
    model_id: str
    display_name: str
    task_type: str  # classification | regression
    description: str
    interpretability: str  # High | Moderate | Low
    training_speed: str  # Fast | Moderate | Slow
    prediction_speed: str  # Fast | Moderate | Slow
    requires_scaling: bool
    is_tree_based: bool
    default_parameters: Dict[str, Any]
    supported_parameters: List[HyperparameterSpec]

class ModelRecommendationItem(BaseModel):
    model_id: str
    display_name: str
    suitability: str  # Highly Recommended | Recommended | Consider with Caution | Not Recommended
    score: int  # 1 to 10
    reasons: List[str]
    limitations: List[str]
    educational_tip: str

class DatasetCharacteristicsSummary(BaseModel):
    row_count: int
    feature_count: int
    numerical_feature_count: int
    categorical_feature_count: int
    missing_value_count: int
    task_type: str
    target_classes_count: Optional[int] = None
    is_imbalanced: Optional[bool] = None

class ModelRecommendationResponse(BaseModel):
    dataset_id: str
    target_column: str
    task_type: str
    dataset_characteristics: DatasetCharacteristicsSummary
    recommended: List[ModelRecommendationItem]
    consider: List[ModelRecommendationItem]
    not_recommended: List[ModelRecommendationItem]
    overall_guidance: str

class ModelRecommendationRequest(BaseModel):
    dataset_id: str
    target_column: Optional[str] = None
    task_type: Optional[str] = None
