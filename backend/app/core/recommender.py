"""
Model Advisor: rule-based educational recommendation engine.
Provides transparent pre-training recommendations based on dataset characteristics,
and evidence-based post-training selections based on actual metrics, generalization gap, and interpretability.
"""
from typing import List, Dict, Any, Optional
import pandas as pd
from app.schemas.model import (
    ModelRecommendationResponse,
    ModelRecommendationItem,
    DatasetCharacteristicsSummary
)
from app.schemas.experiment import (
    ModelResultDetail,
    ComparisonRow,
    PostTrainingAdvisor
)
from app.core.model_registry import ModelRegistry
from app.utils.file_utils import load_csv_safely

class ModelAdvisor:
    """Provides algorithmic guidance for learners before and after experimentation."""

    @staticmethod
    def recommend_pre_training(
        file_path: str,
        dataset_id: str,
        target_column: Optional[str] = None,
        task_type: Optional[str] = None
    ) -> ModelRecommendationResponse:
        df = load_csv_safely(file_path)
        row_count = len(df)
        col_count = len(df.columns)
        num_features = sum(1 for c in df.columns if pd.api.types.is_numeric_dtype(df[c]))
        cat_features = col_count - num_features
        total_missing = int(df.isna().sum().sum())

        target = target_column if (target_column and target_column in df.columns) else df.columns[-1]

        # Determine effective task type
        target_series = df[target].dropna()
        unique_target = int(target_series.nunique())
        is_numeric_target = pd.api.types.is_numeric_dtype(target_series)

        effective_task = task_type
        if not effective_task:
            if not is_numeric_target or unique_target <= 10:
                effective_task = "classification"
            else:
                effective_task = "regression"

        is_imbalanced = False
        target_classes_count = None
        if effective_task == "classification":
            target_classes_count = unique_target
            if unique_target >= 2:
                vcounts = target_series.value_counts()
                ratio = float(vcounts.max() / max(1, vcounts.min()))
                is_imbalanced = ratio >= 3.0

        summary = DatasetCharacteristicsSummary(
            row_count=row_count,
            feature_count=col_count - 1,
            numerical_feature_count=num_features,
            categorical_feature_count=cat_features,
            missing_value_count=total_missing,
            task_type=effective_task,
            target_classes_count=target_classes_count,
            is_imbalanced=is_imbalanced
        )

        recommended: List[ModelRecommendationItem] = []
        consider: List[ModelRecommendationItem] = []
        not_recommended: List[ModelRecommendationItem] = []

        all_models = ModelRegistry.list_models(task_type=effective_task)

        for m in all_models:
            m_id = m.model_id
            name = m.display_name
            reasons = []
            limits = []
            score = 7

            if effective_task == "classification":
                if m_id == "decision_tree":
                    score = 9
                    reasons.append("Highly intuitive split rules that show exact feature thresholds.")
                    reasons.append("Handles mixed data types and requires no feature scaling.")
                    limits.append("Susceptible to high variance and overfitting if max_depth is unrestricted.")
                    tip = "Start with a max_depth of 3-5 to inspect clear tree decisions before expanding."

                elif m_id == "random_forest":
                    score = 9
                    reasons.append("Averages multiple decorrelated trees, substantially reducing variance.")
                    reasons.append("Robust against noise and outliers; provides feature importance.")
                    limits.append("Acts more like a black box compared to a single decision tree.")
                    tip = "Use Random Forest to benchmark the best achievable tree-based accuracy."

                elif m_id == "logistic_regression":
                    score = 8
                    reasons.append("Strong baseline for linearly separable or high-dimensional features.")
                    reasons.append("Produces well-calibrated probabilities for class membership.")
                    if is_imbalanced:
                        limits.append("May favor the majority class without class weighting.")
                    limits.append("Struggles with complex non-linear feature interactions without feature engineering.")
                    tip = "Always check if a simple linear model is sufficient before using ensembles."

                elif m_id == "knn":
                    if row_count > 5000:
                        score = 4
                        reasons.append("Simple instance-based majority vote logic.")
                        limits.append(f"Inference scales with dataset size ({row_count} rows); slow test-time prediction.")
                        limits.append("Sensitive to irrelevant features and the curse of dimensionality.")
                    else:
                        score = 8
                        reasons.append("Intuitive local distance-based predictions.")
                        reasons.append("Adapts naturally to complex multi-modal decision boundaries.")
                        limits.append("Strictly requires feature standardisation; distance metrics distorted by unscaled features.")
                    tip = "Always verify features are standardized when using KNN."

                elif m_id == "gradient_boosting":
                    score = 8
                    reasons.append("Sequentially corrects errors of prior trees; often top performance on tabular data.")
                    limits.append("Slower training time and more hyperparameters to tune.")
                    limits.append("Can overfit noisy data if learning rate is too large.")
                    tip = "Start with a small learning rate (0.05-0.1) and moderate depth (3-5)."

            else:  # Regression
                if m_id == "linear_regression":
                    score = 8
                    reasons.append("Simple, transparent formula with clear weight coefficients for each feature.")
                    reasons.append("Lightning-fast training and prediction.")
                    limits.append("Assumes strictly linear relationship between features and target.")
                    tip = "Inspect residuals to see if non-linear curves exist in the data."

                elif m_id == "decision_tree_regressor":
                    score = 8
                    reasons.append("Models non-linear step-wise relationships without complex transformations.")
                    reasons.append("Easy to explain split thresholds.")
                    limits.append("Predictions are piecewise constant; cannot extrapolate beyond train range.")
                    tip = "Avoid deep unpruned trees to prevent step-like memorization."

                elif m_id == "random_forest_regressor":
                    score = 9
                    reasons.append("Excellent non-linear tabular regression with minimal parameter tuning.")
                    reasons.append("Averages out tree errors for lower RMSE.")
                    limits.append("Higher memory usage and slightly slower prediction speed.")
                    tip = "Observe how increasing n_estimators smooths predicted curve variances."

                elif m_id == "gradient_boosting_regressor":
                    score = 9
                    reasons.append("Usually achieves the lowest RMSE error on tabular regression problems.")
                    limits.append("Requires careful tuning of learning rate and tree depth.")
                    tip = "Watch for the sweet spot where test loss reaches minimum before overfitting."

            item = ModelRecommendationItem(
                model_id=m_id,
                display_name=name,
                suitability="Highly Recommended" if score >= 9 else ("Recommended" if score >= 7 else "Consider with Caution"),
                score=score,
                reasons=reasons,
                limitations=limits,
                educational_tip=tip
            )

            if score >= 8:
                recommended.append(item)
            elif score >= 6:
                consider.append(item)
            else:
                not_recommended.append(item)

        overall_guidance = (
            f"For this {effective_task} dataset ({row_count} rows, {col_count-1} features), "
            f"we advise comparing a simple interpretable model (e.g. {'Logistic Regression or Decision Tree' if effective_task == 'classification' else 'Linear Regression or Decision Tree Regressor'}) "
            f"against an ensemble (e.g. {'Random Forest' if effective_task == 'classification' else 'Random Forest Regressor'}) "
            f"to observe the classic bias-variance and interpretability trade-off."
        )

        return ModelRecommendationResponse(
            dataset_id=dataset_id,
            target_column=target,
            task_type=effective_task,
            dataset_characteristics=summary,
            recommended=recommended,
            consider=consider,
            not_recommended=not_recommended,
            overall_guidance=overall_guidance
        )

    @staticmethod
    def recommend_post_training(
        results: List[ModelResultDetail],
        comparison_table: List[ComparisonRow],
        task_type: str,
        priority: str = "best_performance"
    ) -> PostTrainingAdvisor:
        if not results or not comparison_table:
            return PostTrainingAdvisor(
                winning_model="unknown",
                winning_display_name="Unknown",
                priority_used=priority,
                executive_summary="No models evaluated.",
                why_it_won=[],
                trade_offs=[],
                student_takeaway="Train at least one model to generate recommendations."
            )

        # Winner is top of comparison table
        winner_row = comparison_table[0]
        winner_detail = next(r for r in results if r.model_name == winner_row.model_name)
        meta = ModelRegistry.get_model(winner_row.model_name)

        why_won = []
        trade_offs = []

        if task_type == "classification":
            why_won.append(f"Achieved top F1-score of {round(winner_row.primary_metric_value * 100, 1)}% on held-out test data.")
            if winner_row.cv_mean is not None:
                why_won.append(f"Demonstrated reliable cross-validation performance of {round(winner_row.cv_mean * 100, 1)}% (±{round((winner_row.cv_std or 0.0)*100, 1)}%).")
        else:
            why_won.append(f"Achieved lowest test RMSE of {winner_row.primary_metric_value} (R² score: {winner_row.secondary_metric_value}).")
            if winner_row.cv_mean is not None:
                why_won.append(f"Maintained steady cross-validation score of {winner_row.cv_mean}.")

        if winner_detail.overfitting_risk == "Low":
            why_won.append("Low generalization gap between training and testing splits.")

        if priority == "interpretability" and meta["interpretability"] == "High":
            why_won.append(f"Selected specifically for high interpretability per your requested priority.")
        elif priority == "faster_training":
            why_won.append(f"Trained in just {winner_row.training_time}s, making it optimal for rapid deployment.")

        # Trade offs
        if meta["interpretability"] == "Low":
            trade_offs.append("Acts as a complex ensemble; individual decision logic cannot be easily inspected.")
        if winner_row.training_time > 0.5:
            trade_offs.append(f"Requires more compute ({winner_row.training_time}s) than simpler linear models.")
        if winner_detail.overfitting_risk != "Low":
            trade_offs.append(f"Noticeable generalization gap ({winner_detail.generalization_gap}); consider tuning hyperparameters.")

        if not trade_offs:
            trade_offs.append("No major deficiencies detected under current dataset conditions.")

        summary = (
            f"Based on your criteria ('{priority.replace('_', ' ').title()}'), {winner_row.display_name} "
            f"ranks #1 among the tested algorithms. It offers the strongest balance of performance and stability."
        )

        takeaway = (
            f"In Machine Learning, no algorithm is universally superior ('No Free Lunch Theorem'). "
            f"While {winner_row.display_name} performed best on this specific split, you can test how hyperparameter "
            f"adjustments in Experiment Studio alter its behavior."
        )

        return PostTrainingAdvisor(
            winning_model=winner_row.model_name,
            winning_display_name=winner_row.display_name,
            priority_used=priority,
            executive_summary=summary,
            why_it_won=why_won,
            trade_offs=trade_offs,
            student_takeaway=takeaway
        )
