"""
Dataset analyzer: comprehensive profiling, statistics, and sanity checks.
"""
import math
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

from app.schemas.dataset import (
    ColumnInfo,
    NumericalStat,
    CategoricalStat,
    ClassDistribution,
    DatasetProfileResponse
)
from app.utils.file_utils import load_csv_safely

class DatasetAnalyzer:
    """Profiles datasets and computes descriptive statistics."""

    @staticmethod
    def profile_dataset(file_path: str, dataset_id: str, name: str, target_column: Optional[str] = None, task_type: Optional[str] = None) -> DatasetProfileResponse:
        df = load_csv_safely(file_path)
        row_count = len(df)
        col_count = len(df.columns)
        duplicate_rows = int(df.duplicated().sum())

        columns_info: List[ColumnInfo] = []
        numerical_stats: List[NumericalStat] = []
        categorical_stats: List[CategoricalStat] = []
        target_candidates: List[str] = []

        # Common target-like column naming patterns
        target_name_hints = {
            "target", "label", "class", "species", "diagnosis", "outcome",
            "output", "y", "result", "status", "price", "salary", "churn",
            "passed", "bought", "survived"
        }

        for col in df.columns:
            series = df[col]
            missing_count = int(series.isna().sum())
            missing_pct = round((missing_count / row_count) * 100, 2)
            unique_count = int(series.nunique(dropna=True))

            is_numeric = pd.api.types.is_numeric_dtype(series)
            is_potential_id = False
            warning = None

            # High cardinality identifier check (e.g. ID, index, SSN)
            if unique_count == row_count and row_count > 20:
                is_potential_id = True
                warning = f"Column '{col}' has 100% unique values and might be an identifier/ID column rather than a useful feature."
            elif col.lower() in ("id", "user_id", "student_id", "row_id", "index", "uuid"):
                is_potential_id = True
                warning = f"Column '{col}' looks like an identifier column and should likely be excluded from model features."

            # Categorical vs Numerical determination
            if is_numeric and unique_count > 10:
                data_type = "numerical"
                python_type = "float" if pd.api.types.is_float_dtype(series) else "int"
            elif is_numeric and unique_count <= 10:
                # Could be categorical or integer encoded classes
                data_type = "numerical"
                python_type = "int"
            else:
                data_type = "categorical"
                python_type = "string"

            # Check potential target heuristic
            is_potential_target = False
            col_lower = col.lower()
            if not is_potential_id and unique_count >= 2:
                if any(hint in col_lower for hint in target_name_hints):
                    is_potential_target = True
                elif col == df.columns[-1]:
                    # Last column often candidate, but marked as candidate only, not assumed target
                    is_potential_target = True

            if is_potential_target:
                target_candidates.append(col)

            columns_info.append(
                ColumnInfo(
                    name=col,
                    data_type=data_type,
                    python_type=python_type,
                    missing_count=missing_count,
                    missing_percentage=missing_pct,
                    unique_count=unique_count,
                    is_potential_target=is_potential_target,
                    is_potential_identifier=is_potential_id,
                    warning=warning
                )
            )

            # Compute stats
            if pd.api.types.is_numeric_dtype(series) and not series.dropna().empty:
                valid_num = series.dropna()
                mean_val = float(valid_num.mean())
                std_val = float(valid_num.std()) if len(valid_num) > 1 else 0.0
                min_val = float(valid_num.min())
                q25_val = float(valid_num.quantile(0.25))
                median_val = float(valid_num.median())
                q75_val = float(valid_num.quantile(0.75))
                max_val = float(valid_num.max())

                numerical_stats.append(
                    NumericalStat(
                        column=col,
                        count=len(valid_num),
                        mean=round(mean_val, 3),
                        std=round(std_val if not math.isnan(std_val) else 0.0, 3),
                        min=round(min_val, 3),
                        q25=round(q25_val, 3),
                        median=round(median_val, 3),
                        q75=round(q75_val, 3),
                        max=round(max_val, 3)
                    )
                )
            else:
                top_counts = series.value_counts(dropna=True).head(10).to_dict()
                top_val = str(series.mode().iloc[0]) if not series.dropna().empty else None
                top_freq = int(series.value_counts().iloc[0]) if not series.dropna().empty else 0
                categorical_stats.append(
                    CategoricalStat(
                        column=col,
                        unique_count=unique_count,
                        top_value=top_val,
                        top_frequency=top_freq,
                        value_counts={str(k): int(v) for k, v in top_counts.items()}
                    )
                )

        # Target class distribution if target is selected
        class_dist: Optional[ClassDistribution] = None
        effective_target = target_column if (target_column and target_column in df.columns) else None

        if effective_target:
            t_series = df[effective_target].dropna()
            val_counts = t_series.value_counts().to_dict()
            counts_dict = {str(k): int(v) for k, v in val_counts.items()}

            if len(counts_dict) >= 2:
                max_c = max(counts_dict.values())
                min_c = min(counts_dict.values())
                ratio = round(max_c / max(1, min_c), 2)
                is_imbal = ratio >= 3.0
                dist_warning = (
                    f"Target exhibits class imbalance (ratio {ratio}:1). Minority classes might suffer without balanced evaluation or weighting."
                    if is_imbal else None
                )
                class_dist = ClassDistribution(
                    target_column=effective_target,
                    classes=counts_dict,
                    imbalance_ratio=ratio,
                    is_imbalanced=is_imbal,
                    warning=dist_warning
                )

        # Numerical correlation matrix (clean for frontend heatmaps)
        correlations: Dict[str, Dict[str, float]] = {}
        num_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        if len(num_cols) >= 2:
            corr_df = df[num_cols].corr()
            for c1 in num_cols:
                correlations[c1] = {}
                for c2 in num_cols:
                    val = corr_df.loc[c1, c2]
                    correlations[c1][c2] = round(float(val), 3) if not math.isnan(val) else 0.0

        # Sample preview (first 8 rows), replacing NaN/inf with None for valid JSON serialization
        preview_df = df.head(8).replace({np.nan: None, np.inf: None, -np.inf: None})
        sample_preview = preview_df.to_dict(orient="records")

        return DatasetProfileResponse(
            dataset_id=dataset_id,
            name=name,
            row_count=row_count,
            column_count=col_count,
            duplicate_rows=duplicate_rows,
            columns=columns_info,
            numerical_stats=numerical_stats,
            categorical_stats=categorical_stats,
            sample_preview=sample_preview,
            target_candidates=target_candidates,
            target_column=target_column,
            task_type=task_type,
            class_distribution=class_dist,
            correlations=correlations if correlations else None
        )
