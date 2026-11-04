"""
Model comparison engine: ranks and benchmarks trained models according to objective metrics and student priorities.
"""
from typing import List, Dict, Any, Optional
from app.schemas.experiment import ModelResultDetail, ComparisonRow
from app.core.model_registry import ModelRegistry

class ModelComparator:
    """Compares trained models fairly across performance, speed, interpretability, and generalization."""

    @staticmethod
    def compare(
        results: List[ModelResultDetail],
        task_type: str,
        priority: str = "best_performance"
    ) -> List[ComparisonRow]:
        if not results:
            return []

        rows: List[ComparisonRow] = []

        # Find fastest model for badge
        fastest_time = min(r.training_time for r in results)

        for res in results:
            meta = ModelRegistry.get_model(res.model_name)
            badges: List[str] = []

            if res.training_time <= fastest_time * 1.05:
                badges.append("⚡ Fastest Training")

            if meta["interpretability"] == "High":
                badges.append("🔍 Highly Interpretable")

            if res.overfitting_risk == "Low":
                badges.append("🛡️ Low Overfit Risk")

            if task_type == "classification":
                primary_name = "f1_score"
                primary_val = float(res.metrics.get("f1_score", 0.0))
                secondary_val = float(res.metrics.get("accuracy", 0.0))
            else:
                primary_name = "rmse"
                primary_val = float(res.metrics.get("rmse", 999999.0))
                secondary_val = float(res.metrics.get("r2_score", 0.0))

            cv_mean = res.metrics.get("cv_mean")
            cv_std = res.metrics.get("cv_std")

            rows.append(
                ComparisonRow(
                    model_name=res.model_name,
                    display_name=res.display_name,
                    rank=1,  # will be assigned after sorting
                    primary_metric_name=primary_name,
                    primary_metric_value=primary_val,
                    secondary_metric_value=secondary_val,
                    cv_mean=float(cv_mean) if cv_mean is not None else None,
                    cv_std=float(cv_std) if cv_std is not None else None,
                    training_time=res.training_time,
                    interpretability=meta["interpretability"],
                    train_test_gap=res.generalization_gap,
                    badges=badges
                )
            )

        # Sorting based on priority & task type
        def sort_key(row: ComparisonRow):
            interp_score = 3 if row.interpretability == "High" else (2 if row.interpretability == "Moderate" else 1)
            time_score = -row.training_time  # faster is better

            if task_type == "classification":
                # Higher primary_metric (F1) is better
                perf_score = row.primary_metric_value
            else:
                # Lower primary_metric (RMSE) is better
                perf_score = -row.primary_metric_value

            if priority == "interpretability":
                return (interp_score, perf_score, time_score)
            elif priority == "faster_training":
                return (time_score, perf_score, interp_score)
            elif priority == "simpler_model":
                return (interp_score, -abs(row.train_test_gap or 0.0), perf_score)
            else:  # "best_performance"
                return (perf_score, interp_score, time_score)

        sorted_rows = sorted(rows, key=sort_key, reverse=True)

        # Assign ranks & best performer badge
        for i, row in enumerate(sorted_rows):
            row.rank = i + 1
            if i == 0:
                row.badges.insert(0, "🏆 Top Pick")

        return sorted_rows
