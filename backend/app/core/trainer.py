"""
Model training engine: orchestrates dataset loading, fair train/test splitting,
pipeline construction, model training, evaluation, and experiment persistence.
"""
import time
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.model_registry import ModelRegistry
from app.core.preprocessing import identify_feature_types, build_model_pipeline
from app.core.evaluator import ModelEvaluator
from app.core.comparator import ModelComparator
from app.core.recommender import ModelAdvisor
from app.database.models import ExperimentModel, ModelResultModel
from app.utils.file_utils import load_csv_safely, generate_experiment_id
from app.utils.validators import validate_target_column, validate_selected_features, validate_task_type
from app.schemas.experiment import (
    ExperimentRunResponse,
    ModelResultDetail,
    ExperimentTuneResponse,
    MetricDifference
)

class ModelTrainer:
    """Executes fair ML training pipelines and records all metrics."""

    @staticmethod
    def train_experiment(
        file_path: str,
        dataset_id: str,
        target_column: str,
        task_type: str,
        model_names: List[str],
        test_size: float = 0.2,
        random_state: int = 42,
        cv_folds: int = 5,
        priority: str = "best_performance",
        selected_features: Optional[List[str]] = None,
        db: Optional[Session] = None
    ) -> ExperimentRunResponse:
        # 1. Load and validate
        df = load_csv_safely(file_path)
        validate_target_column(df, target_column)
        task_type = validate_task_type(task_type)
        feature_cols = validate_selected_features(df, target_column, selected_features)

        # 2. Prepare X and y
        # Drop rows where target is NaN
        valid_df = df.dropna(subset=[target_column]).copy()
        if len(valid_df) < 5:
            raise HTTPException(status_code=400, detail="Not enough valid rows remaining after dropping missing target values.")

        X = valid_df[feature_cols]
        y = valid_df[target_column]

        # Convert target to numeric if regression
        if task_type == "regression":
            if not pd.api.types.is_numeric_dtype(y):
                raise HTTPException(status_code=400, detail=f"Target column '{target_column}' is not numeric. Cannot run regression on categorical text.")
            y = y.astype(float)

        # 3. Train/test split (Stratify for classification if viable)
        stratify_arg = None
        if task_type == "classification":
            class_counts = y.value_counts()
            if (class_counts >= 2).all() and len(class_counts) > 1:
                stratify_arg = y

        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y,
                test_size=test_size,
                random_state=random_state,
                stratify=stratify_arg
            )
        except Exception as e:
            # Fallback without stratification
            X_train, X_test, y_train, y_test = train_test_split(
                X, y,
                test_size=test_size,
                random_state=random_state
            )

        num_cols, cat_cols = identify_feature_types(X_train)

        # 4. Train each selected algorithm
        results: List[ModelResultDetail] = []
        experiment_id = generate_experiment_id()

        for m_name in model_names:
            try:
                model_meta = ModelRegistry.get_model(m_name)
            except ValueError as ve:
                raise HTTPException(status_code=400, detail=str(ve))

            if model_meta["task_type"] != task_type:
                raise HTTPException(
                    status_code=400,
                    detail=f"Model '{m_name}' is for '{model_meta['task_type']}', but experiment task type is '{task_type}'."
                )

            estimator, applied_params = ModelRegistry.instantiate(m_name, random_state=random_state)
            pipeline = build_model_pipeline(
                model_estimator=estimator,
                numerical_cols=num_cols,
                categorical_cols=cat_cols,
                scale_numeric=model_meta["requires_scaling"]
            )

            # Fit and record training duration
            t0 = time.perf_counter()
            pipeline.fit(X_train, y_train)
            training_duration = round(time.perf_counter() - t0, 4)

            # Evaluate
            if task_type == "classification":
                detail = ModelEvaluator.evaluate_classification(
                    model_pipeline=pipeline,
                    X_train=X_train,
                    y_train=y_train,
                    X_test=X_test,
                    y_test=y_test,
                    model_name=m_name,
                    display_name=model_meta["display_name"],
                    training_time=training_duration,
                    params=applied_params,
                    cv_folds=cv_folds
                )
            else:
                detail = ModelEvaluator.evaluate_regression(
                    model_pipeline=pipeline,
                    X_train=X_train,
                    y_train=y_train,
                    X_test=X_test,
                    y_test=y_test,
                    model_name=m_name,
                    display_name=model_meta["display_name"],
                    training_time=training_duration,
                    params=applied_params,
                    cv_folds=cv_folds
                )

            results.append(detail)

        # 5. Build comparison table
        comparison_table = ModelComparator.compare(results, task_type=task_type, priority=priority)

        # 6. Post-training recommendation
        recommendation = ModelAdvisor.recommend_post_training(
            results=results,
            comparison_table=comparison_table,
            task_type=task_type,
            priority=priority
        )

        # 7. Persist in database if session provided
        if db is not None:
            import json
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            exp_record = ExperimentModel(
                id=experiment_id,
                dataset_id=dataset_id,
                target_column=target_column,
                task_type=task_type,
                selected_features=json.dumps(feature_cols),
                test_size=test_size,
                random_state=random_state,
                cross_validation_folds=cv_folds,
                priority=priority,
                recommendation_json=json.dumps(recommendation.model_dump()),
                created_at=now
            )
            db.add(exp_record)

            for res in results:
                m_record = ModelResultModel(
                    experiment_id=experiment_id,
                    model_name=res.model_name,
                    display_name=res.display_name,
                    metrics_json=json.dumps(res.metrics),
                    parameters_json=json.dumps(res.parameters),
                    training_time=res.training_time,
                    prediction_time=res.prediction_time,
                    created_at=now
                )
                db.add(m_record)

            db.commit()

        from datetime import datetime, timezone
        return ExperimentRunResponse(
            experiment_id=experiment_id,
            dataset_id=dataset_id,
            target_column=target_column,
            task_type=task_type,
            test_size=test_size,
            random_state=random_state,
            cross_validation_folds=cv_folds,
            selected_features=feature_cols,
            results=results,
            comparison_table=comparison_table,
            recommendation=recommendation,
            created_at=datetime.now(timezone.utc)
        )

    @staticmethod
    def tune_hyperparameters(
        file_path: str,
        experiment: ExperimentModel,
        model_name: str,
        hyperparameters: Dict[str, Any],
        db: Optional[Session] = None
    ) -> ExperimentTuneResponse:
        """
        Retrain a single model with modified hyperparameters on the EXACT same split
        and compute detailed performance deltas and educational feedback.
        """
        # Load dataset
        df = load_csv_safely(file_path)
        feature_cols = experiment.get_selected_features()
        target_column = experiment.target_column
        task_type = experiment.task_type

        valid_df = df.dropna(subset=[target_column]).copy()
        X = valid_df[feature_cols]
        y = valid_df[target_column]

        if task_type == "regression":
            y = y.astype(float)

        stratify_arg = None
        if task_type == "classification":
            class_counts = y.value_counts()
            if (class_counts >= 2).all() and len(class_counts) > 1:
                stratify_arg = y

        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y,
                test_size=experiment.test_size,
                random_state=experiment.random_state,
                stratify=stratify_arg
            )
        except Exception:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y,
                test_size=experiment.test_size,
                random_state=experiment.random_state
            )

        num_cols, cat_cols = identify_feature_types(X_train)
        # Find original model result in experiment
        orig_res = None
        for r in experiment.results:
            if r.model_name == model_name:
                orig_res = r
                break

        if orig_res is None:
            available_models = [r.model_name for r in experiment.results]
            raise HTTPException(
                status_code=400,
                detail=f"Model '{model_name}' was not evaluated in experiment '{experiment.id}'. Available models: {available_models}"
            )

        try:
            model_meta = ModelRegistry.get_model(model_name)
            merged_params = dict(model_meta["default_parameters"])
            merged_params.update(hyperparameters)
            estimator, applied_params = ModelRegistry.instantiate(
                model_name,
                custom_params=merged_params,
                random_state=experiment.random_state
            )
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))

        pipeline = build_model_pipeline(
            model_estimator=estimator,
            numerical_cols=num_cols,
            categorical_cols=cat_cols,
            scale_numeric=model_meta["requires_scaling"]
        )

        t0 = time.perf_counter()
        pipeline.fit(X_train, y_train)
        train_time = round(time.perf_counter() - t0, 4)

        if task_type == "classification":
            new_detail = ModelEvaluator.evaluate_classification(
                model_pipeline=pipeline,
                X_train=X_train,
                y_train=y_train,
                X_test=X_test,
                y_test=y_test,
                model_name=model_name,
                display_name=model_meta["display_name"],
                training_time=train_time,
                params=applied_params,
                cv_folds=experiment.cross_validation_folds
            )
        else:
            new_detail = ModelEvaluator.evaluate_regression(
                model_pipeline=pipeline,
                X_train=X_train,
                y_train=y_train,
                X_test=X_test,
                y_test=y_test,
                model_name=model_name,
                display_name=model_meta["display_name"],
                training_time=train_time,
                params=applied_params,
                cv_folds=experiment.cross_validation_folds
            )

        orig_metrics = orig_res.get_metrics()
        tuned_metrics = new_detail.metrics

        # Compute differences
        diffs: Dict[str, MetricDifference] = {}
        for k in ["accuracy", "f1_score", "precision", "recall", "r2_score", "rmse", "mae"]:
            if k in orig_metrics and k in tuned_metrics and orig_metrics[k] is not None and tuned_metrics[k] is not None:
                orig_v = float(orig_metrics[k])
                tuned_v = float(tuned_metrics[k])
                diff = round(tuned_v - orig_v, 4)
                # For error metrics, lower is improved
                if k in ("rmse", "mae", "mse"):
                    improved = diff < 0
                else:
                    improved = diff > 0

                diffs[k] = MetricDifference(
                    original=orig_v,
                    tuned=tuned_v,
                    difference=diff,
                    improved=improved
                )

        # Generate educational analysis of what changed
        analysis_points = []
        for param, val in hyperparameters.items():
            if param in ("max_depth", "n_estimators"):
                analysis_points.append(f"Setting `{param}={val}` altered model complexity.")
            elif param in ("min_samples_split", "min_samples_leaf"):
                analysis_points.append(f"Constraint `{param}={val}` limits granular node splitting to prevent overfitting.")
            elif param == "C":
                analysis_points.append(f"Inverse regularization `C={val}` governs margin vs training error tolerance.")
            elif param == "n_neighbors":
                analysis_points.append(f"K-neighbors `k={val}` controls smoothness of the decision boundary.")

        gap_change = (
            f"Train score: {new_detail.train_score}, Test score: {new_detail.test_score} "
            f"(Generalization gap: {new_detail.generalization_gap}, Risk: {new_detail.overfitting_risk})."
        )

        impact_text = " ".join(analysis_points) + " " + (new_detail.explanation or "")

        return ExperimentTuneResponse(
            experiment_id=experiment.id,
            model_name=model_name,
            display_name=model_meta["display_name"],
            applied_parameters=applied_params,
            original_metrics=orig_metrics,
            tuned_metrics=tuned_metrics,
            metric_differences=diffs,
            educational_impact_analysis=impact_text,
            train_test_gap_change=gap_change
        )
