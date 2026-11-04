"""
Task detector: determines whether a target is suitable for classification or regression,
and validates user-selected task type with educational explanations.
"""
from typing import Tuple, List, Optional
import pandas as pd
from app.schemas.dataset import ValidationReport

class TaskDetector:
    """Analyzes target column properties to detect and validate task types."""

    @staticmethod
    def detect_and_validate(df: pd.DataFrame, target_column: str, user_task_type: Optional[str] = None) -> ValidationReport:
        if target_column not in df.columns:
            return ValidationReport(
                is_valid=False,
                detected_task="unknown",
                recommended_task="unknown",
                warnings=[f"Target column '{target_column}' is not present in the dataset."],
                target_unique_count=0,
                target_data_type="unknown"
            )

        target_series = df[target_column].dropna()
        unique_count = int(target_series.nunique())
        row_count = len(target_series)
        dtype = target_series.dtype

        if unique_count < 2:
            return ValidationReport(
                is_valid=False,
                detected_task="invalid",
                recommended_task="invalid",
                warnings=[f"Target column '{target_column}' has only {unique_count} distinct value. Machine learning requires at least 2 distinct target values."],
                target_unique_count=unique_count,
                target_data_type="constant"
            )

        warnings: List[str] = []
        is_numeric = pd.api.types.is_numeric_dtype(target_series)
        is_float = pd.api.types.is_float_dtype(target_series)

        # 1. Heuristic detection of most natural task
        if not is_numeric:
            # String, object, boolean, category -> Strictly classification
            detected_task = "classification"
            target_data_type = "categorical"
        else:
            # Numeric: could be classification or regression
            unique_ratio = unique_count / max(1, row_count)
            if unique_count <= 10:
                # Small distinct numbers (e.g. 0/1, 1/2/3, ratings 1-5) -> classification is standard
                detected_task = "classification"
                target_data_type = f"discrete_numeric (integer-like, {unique_count} distinct values)"
            elif is_float and unique_ratio > 0.05:
                # Continuous decimal values
                detected_task = "regression"
                target_data_type = "continuous_float"
            elif unique_count > 25:
                # High cardinality numbers
                detected_task = "regression"
                target_data_type = "high_cardinality_numeric"
            else:
                # Ambiguous (11-25 unique integer values)
                detected_task = "classification" if unique_ratio < 0.1 else "regression"
                target_data_type = f"numeric ({unique_count} unique values)"

        recommended_task = detected_task

        # 2. Validate against user's choice if provided
        is_valid = True
        if user_task_type:
            user_choice = user_task_type.lower().strip()
            if user_choice not in ("classification", "regression"):
                return ValidationReport(
                    is_valid=False,
                    detected_task=detected_task,
                    recommended_task=recommended_task,
                    warnings=[f"Invalid task type '{user_task_type}'. Must be 'classification' or 'regression'."],
                    target_unique_count=unique_count,
                    target_data_type=target_data_type
                )

            if user_choice == "regression":
                if not is_numeric:
                    is_valid = False
                    warnings.append(
                        f"Cannot configure task as 'regression': target column '{target_column}' contains text/categorical data ({dtype}). Regression models predict continuous numerical quantities."
                    )
                elif unique_count < 3:
                    warnings.append(
                        f"Target '{target_column}' has only {unique_count} unique numerical values (likely binary 0/1). While mathematical regression is possible, Classification is standard and far more appropriate for discrete categories."
                    )

            elif user_choice == "classification":
                if is_numeric and unique_count > 50 and unique_ratio > 0.3:
                    warnings.append(
                        f"Target '{target_column}' has {unique_count} distinct continuous values ({round(unique_ratio * 100, 1)}% unique). Treating this as classification will create {unique_count} separate classes with very few samples per class, leading to severe overfitting or poor generalization. Regression is recommended."
                    )
                elif is_float and unique_count > 30:
                    warnings.append(
                        f"Target '{target_column}' is a floating-point numeric column with {unique_count} unique values. Ensure discrete class labels are intended rather than a continuous target."
                    )

        return ValidationReport(
            is_valid=is_valid,
            detected_task=detected_task,
            recommended_task=recommended_task,
            warnings=warnings,
            target_unique_count=unique_count,
            target_data_type=target_data_type
        )
