"""
Evaluation engine: computes authentic performance metrics for classification and regression models.
No hardcoded values. Handles edge cases gracefully and detects generalization gaps/overfitting.
"""
import time
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    mean_absolute_error,
    mean_squared_error,
    r2_score
)
from sklearn.model_selection import cross_val_score, KFold, StratifiedKFold
from app.schemas.experiment import ConfusionMatrixData, ModelResultDetail

class ModelEvaluator:
    """Computes comprehensive evaluation metrics on training and held-out test splits."""

    @staticmethod
    def evaluate_classification(
        model_pipeline,
        X_train,
        y_train,
        X_test,
        y_test,
        model_name: str,
        display_name: str,
        training_time: float,
        params: Dict[str, Any],
        cv_folds: int = 5
    ) -> ModelResultDetail:
        # Measure prediction time on test set
        pred_start = time.perf_counter()
        y_pred = model_pipeline.predict(X_test)
        prediction_time = round(time.perf_counter() - pred_start, 4)

        # Training set predictions to measure generalization gap
        y_train_pred = model_pipeline.predict(X_train)

        train_acc = round(float(accuracy_score(y_train, y_train_pred)), 4)
        test_acc = round(float(accuracy_score(y_test, y_pred)), 4)

        unique_classes = np.unique(np.concatenate([np.array(y_train), np.array(y_test)]))
        is_binary = len(unique_classes) == 2
        avg_method = "binary" if is_binary else "weighted"

        try:
            prec = round(float(precision_score(y_test, y_pred, average=avg_method, zero_division=0)), 4)
        except Exception:
            prec = round(float(precision_score(y_test, y_pred, average="weighted", zero_division=0)), 4)

        try:
            rec = round(float(recall_score(y_test, y_pred, average=avg_method, zero_division=0)), 4)
        except Exception:
            rec = round(float(recall_score(y_test, y_pred, average="weighted", zero_division=0)), 4)

        try:
            f1 = round(float(f1_score(y_test, y_pred, average=avg_method, zero_division=0)), 4)
        except Exception:
            f1 = round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4)

        # Confusion Matrix
        labels = [str(c) for c in unique_classes]
        cm = confusion_matrix(y_test, y_pred, labels=unique_classes)
        cm_data = ConfusionMatrixData(
            labels=labels,
            matrix=cm.tolist()
        )

        # Classification Report dict
        try:
            clf_report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        except Exception:
            clf_report = {}

        # Cross-validation on training set (safe fold count)
        min_class_count = min(np.bincount(pd.factorize(y_train)[0])) if len(y_train) > 0 else 1
        effective_folds = min(cv_folds, min_class_count, len(y_train))
        cv_mean = None
        cv_std = None

        if effective_folds >= 2:
            try:
                cv = StratifiedKFold(n_splits=effective_folds, shuffle=True, random_state=42)
                scores = cross_val_score(model_pipeline, X_train, y_train, cv=cv, scoring="accuracy")
                cv_mean = round(float(np.mean(scores)), 4)
                cv_std = round(float(np.std(scores)), 4)
            except Exception:
                pass

        # Train vs Test gap
        gap = round(train_acc - test_acc, 4)
        if gap > 0.15:
            overfit_risk = "High"
            explanation = (
                f"{display_name} shows signs of significant overfitting: training accuracy is {round(train_acc*100, 1)}% "
                f"while test accuracy drops to {round(test_acc*100, 1)}% (gap: {round(gap*100, 1)}%). Consider regularizing."
            )
        elif gap > 0.05:
            overfit_risk = "Moderate"
            explanation = f"{display_name} performs well with a moderate generalization gap of {round(gap*100, 1)}%."
        else:
            overfit_risk = "Low"
            explanation = f"{display_name} generalizes exceptionally well with consistent performance across train and test sets."

        # Extract feature importances if available
        feature_importance = ModelEvaluator._extract_feature_importance(model_pipeline, X_train.columns)

        metrics = {
            "accuracy": test_acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "averaging_method": avg_method,
            "cv_mean": cv_mean,
            "cv_std": cv_std,
            "classification_report": clf_report
        }

        return ModelResultDetail(
            model_name=model_name,
            display_name=display_name,
            metrics=metrics,
            parameters=params,
            training_time=training_time,
            prediction_time=prediction_time,
            feature_importance=feature_importance,
            confusion_matrix=cm_data,
            train_score=train_acc,
            test_score=test_acc,
            generalization_gap=gap,
            overfitting_risk=overfit_risk,
            explanation=explanation
        )

    @staticmethod
    def evaluate_regression(
        model_pipeline,
        X_train,
        y_train,
        X_test,
        y_test,
        model_name: str,
        display_name: str,
        training_time: float,
        params: Dict[str, Any],
        cv_folds: int = 5
    ) -> ModelResultDetail:
        # Measure prediction time on test set
        pred_start = time.perf_counter()
        y_pred = model_pipeline.predict(X_test)
        prediction_time = round(time.perf_counter() - pred_start, 4)

        # Training set predictions
        y_train_pred = model_pipeline.predict(X_train)

        train_r2 = round(float(r2_score(y_train, y_train_pred)), 4)
        test_r2 = round(float(r2_score(y_test, y_pred)), 4)

        mae = round(float(mean_absolute_error(y_test, y_pred)), 4)
        mse = round(float(mean_squared_error(y_test, y_pred)), 4)
        rmse = round(float(np.sqrt(mse)), 4)

        # Cross-validation
        effective_folds = min(cv_folds, len(y_train))
        cv_mean = None
        cv_std = None

        if effective_folds >= 2:
            try:
                cv = KFold(n_splits=effective_folds, shuffle=True, random_state=42)
                scores = cross_val_score(model_pipeline, X_train, y_train, cv=cv, scoring="r2")
                cv_mean = round(float(np.mean(scores)), 4)
                cv_std = round(float(np.std(scores)), 4)
            except Exception:
                pass

        # Gap
        gap = round(train_r2 - test_r2, 4)
        if gap > 0.20:
            overfit_risk = "High"
            explanation = (
                f"{display_name} exhibits high variance: train R² is {train_r2} but test R² is {test_r2} (gap: {gap}). "
                f"The model may be memorizing training noise."
            )
        elif gap > 0.08:
            overfit_risk = "Moderate"
            explanation = f"{display_name} generalizes moderately well with an R² gap of {gap} between training and test sets."
        else:
            overfit_risk = "Low"
            explanation = f"{display_name} shows strong generalization stability between training and unseen test data."

        feature_importance = ModelEvaluator._extract_feature_importance(model_pipeline, X_train.columns)

        metrics = {
            "r2_score": test_r2,
            "mae": mae,
            "mse": mse,
            "rmse": rmse,
            "cv_mean": cv_mean,
            "cv_std": cv_std
        }

        return ModelResultDetail(
            model_name=model_name,
            display_name=display_name,
            metrics=metrics,
            parameters=params,
            training_time=training_time,
            prediction_time=prediction_time,
            feature_importance=feature_importance,
            train_score=train_r2,
            test_score=test_r2,
            generalization_gap=gap,
            overfitting_risk=overfit_risk,
            explanation=explanation
        )

    @staticmethod
    def _extract_feature_importance(pipeline, original_feature_names: List[str]) -> Optional[Dict[str, float]]:
        """
        Extract feature importances or linear coefficients if supported by the estimator.
        """
        try:
            model = pipeline.named_steps.get("classifier")
            if not model:
                return None

            # Tree-based feature importances
            if hasattr(model, "feature_importances_"):
                importances = model.feature_importances_
                # Get transformed feature names if possible
                preprocessor = pipeline.named_steps.get("preprocessor")
                if hasattr(preprocessor, "get_feature_names_out"):
                    feature_names = [f.split("__")[-1] for f in preprocessor.get_feature_names_out()]
                else:
                    feature_names = list(original_feature_names)

                if len(feature_names) == len(importances):
                    raw_dict = {name: round(float(val), 4) for name, val in zip(feature_names, importances)}
                    sorted_dict = dict(sorted(raw_dict.items(), key=lambda item: item[1], reverse=True)[:10])
                    return sorted_dict

            # Linear model coefficients
            if hasattr(model, "coef_"):
                coefs = model.coef_
                # If 2D (e.g. multiclass logistic), take absolute mean across classes
                if coefs.ndim > 1:
                    coefs = np.mean(np.abs(coefs), axis=0)
                else:
                    coefs = np.abs(coefs)

                preprocessor = pipeline.named_steps.get("preprocessor")
                if hasattr(preprocessor, "get_feature_names_out"):
                    feature_names = [f.split("__")[-1] for f in preprocessor.get_feature_names_out()]
                else:
                    feature_names = list(original_feature_names)

                if len(feature_names) == len(coefs):
                    raw_dict = {name: round(float(val), 4) for name, val in zip(feature_names, coefs)}
                    sorted_dict = dict(sorted(raw_dict.items(), key=lambda item: item[1], reverse=True)[:10])
                    return sorted_dict
        except Exception:
            return None

        return None
