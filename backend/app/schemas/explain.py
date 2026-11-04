"""
Pydantic schemas for the Decision Tree Explainer (Gini, Entropy, Information Gain).
"""
from typing import List, Dict, Any, Union
from pydantic import BaseModel, Field

class GiniRequest(BaseModel):
    class_counts: Union[Dict[str, int], List[int]] = Field(
        ...,
        description="Either a list of counts e.g. [50, 50] or a dictionary e.g. {'class_A': 50, 'class_B': 50}"
    )

class GiniResponse(BaseModel):
    class_counts: Dict[str, int]
    total_samples: int
    probabilities: Dict[str, float]
    sum_squared_probabilities: float
    gini_impurity: float
    formula: str
    steps: List[str]
    interpretation: str

class EntropyRequest(BaseModel):
    class_counts: Union[Dict[str, int], List[int]] = Field(
        ...,
        description="Either a list of counts e.g. [30, 70] or a dictionary e.g. {'apple': 30, 'orange': 70}"
    )

class EntropyResponse(BaseModel):
    class_counts: Dict[str, int]
    total_samples: int
    probabilities: Dict[str, float]
    entropy: float
    formula: str
    steps: List[str]
    interpretation: str

class ChildSplitData(BaseModel):
    child_name: str
    class_counts: Union[Dict[str, int], List[int]]

class InformationGainRequest(BaseModel):
    parent_counts: Union[Dict[str, int], List[int]] = Field(
        ...,
        description="Class counts at the parent node before splitting"
    )
    children: List[ChildSplitData] = Field(
        ...,
        min_length=2,
        description="List of child nodes after split (e.g. Left Child and Right Child)"
    )
    criterion: str = Field("entropy", description="'entropy' or 'gini'")

class ChildSplitResult(BaseModel):
    child_name: str
    class_counts: Dict[str, int]
    sample_count: int
    weight: float
    impurity_value: float
    probabilities: Dict[str, float]

class InformationGainResponse(BaseModel):
    criterion: str
    parent_impurity: float
    parent_counts: Dict[str, int]
    total_samples: int
    children: List[ChildSplitResult]
    weighted_child_impurity: float
    information_gain: float
    step_by_step_explanation: List[str]
    evaluation_verdict: str
