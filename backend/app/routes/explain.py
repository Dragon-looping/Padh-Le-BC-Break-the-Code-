"""
Decision Tree Explainer routes: interactive calculation of Gini Impurity,
Entropy, and Information Gain with step-by-step mathematical breakdowns.
"""
from fastapi import APIRouter, HTTPException
from app.schemas.explain import (
    GiniRequest,
    GiniResponse,
    EntropyRequest,
    EntropyResponse,
    InformationGainRequest,
    InformationGainResponse
)
from app.core.explainer import TreeExplainer

router = APIRouter(prefix="/api/explain", tags=["Decision Tree Explainer"])

@router.post("/gini", response_model=GiniResponse)
def calculate_gini(payload: GiniRequest):
    """
    Calculate Gini Impurity for class counts.
    Formula: Gini = 1 - sum(p_i^2)
    Returns probabilities, squared probabilities, and step-by-step mathematical reasoning.
    """
    try:
        return TreeExplainer.calculate_gini(payload.class_counts)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/entropy", response_model=EntropyResponse)
def calculate_entropy(payload: EntropyRequest):
    """
    Calculate Information Entropy in bits.
    Formula: Entropy = -sum(p_i * log2(p_i))
    Returns probability terms, log terms, and step-by-step calculation steps.
    """
    try:
        return TreeExplainer.calculate_entropy(payload.class_counts)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/information-gain", response_model=InformationGainResponse)
def calculate_information_gain(payload: InformationGainRequest):
    """
    Calculate Information Gain resulting from a node split.
    Formula: Information Gain = Parent Impurity - Weighted Child Impurity
    Supports both Entropy and Gini criteria.
    """
    try:
        return TreeExplainer.calculate_information_gain(
            parent_counts=payload.parent_counts,
            children=payload.children,
            criterion=payload.criterion
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
