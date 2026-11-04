"""
Database models for PADH LE BC.
"""
from datetime import datetime, timezone
import json
from typing import List, Optional, Any, Dict
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def get_utc_now():
    return datetime.now(timezone.utc)

class DatasetModel(Base):
    """
    Metadata for uploaded and built-in sample datasets.
    """
    __tablename__ = "datasets"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    row_count = Column(Integer, nullable=False, default=0)
    column_count = Column(Integer, nullable=False, default=0)
    target_column = Column(String(128), nullable=True)
    task_type = Column(String(64), nullable=True)  # classification | regression
    selected_features = Column(Text, nullable=True)  # JSON-encoded list of features
    is_sample = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)

    experiments = relationship("ExperimentModel", back_populates="dataset", cascade="all, delete-orphan")

    def get_selected_features(self) -> Optional[List[str]]:
        if self.selected_features:
            try:
                return json.loads(self.selected_features)
            except Exception:
                return None
        return None

    def set_selected_features(self, features: Optional[List[str]]) -> None:
        if features is not None:
            self.selected_features = json.dumps(features)
        else:
            self.selected_features = None


class ExperimentModel(Base):
    """
    Model training experiment configuration and history.
    """
    __tablename__ = "experiments"

    id = Column(String(64), primary_key=True, index=True)
    dataset_id = Column(String(64), ForeignKey("datasets.id"), nullable=False, index=True)
    target_column = Column(String(128), nullable=False)
    task_type = Column(String(64), nullable=False)  # classification | regression
    selected_features = Column(Text, nullable=False)  # JSON-encoded list of feature column names
    test_size = Column(Float, nullable=False, default=0.2)
    random_state = Column(Integer, nullable=False, default=42)
    cross_validation_folds = Column(Integer, nullable=False, default=5)
    priority = Column(String(64), nullable=True, default="best_performance")
    recommendation_json = Column(Text, nullable=True)  # JSON-encoded advisor recommendation
    created_at = Column(DateTime, default=get_utc_now)

    dataset = relationship("DatasetModel", back_populates="experiments")
    results = relationship("ModelResultModel", back_populates="experiment", cascade="all, delete-orphan")

    def get_selected_features(self) -> List[str]:
        try:
            return json.loads(self.selected_features)
        except Exception:
            return []

    def get_recommendation(self) -> Optional[Dict[str, Any]]:
        if self.recommendation_json:
            try:
                return json.loads(self.recommendation_json)
            except Exception:
                return None
        return None


class ModelResultModel(Base):
    """
    Individual algorithm evaluation result within an experiment.
    """
    __tablename__ = "model_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    experiment_id = Column(String(64), ForeignKey("experiments.id"), nullable=False, index=True)
    model_name = Column(String(64), nullable=False)
    display_name = Column(String(128), nullable=False)
    metrics_json = Column(Text, nullable=False)  # JSON serialized dictionary of evaluated metrics
    parameters_json = Column(Text, nullable=False)  # JSON serialized hyperparameter dict
    training_time = Column(Float, nullable=False, default=0.0)
    prediction_time = Column(Float, nullable=True, default=0.0)
    created_at = Column(DateTime, default=get_utc_now)

    experiment = relationship("ExperimentModel", back_populates="results")

    def get_metrics(self) -> Dict[str, Any]:
        try:
            return json.loads(self.metrics_json)
        except Exception:
            return {}

    def get_parameters(self) -> Dict[str, Any]:
        try:
            return json.loads(self.parameters_json)
        except Exception:
            return {}
