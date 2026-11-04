"""
Decision Tree Explainer: Step-by-step mathematical calculation of
Gini Impurity, Entropy, and Information Gain for educational transparency.
"""
import math
from typing import Dict, List, Union
from app.schemas.explain import (
    GiniResponse,
    EntropyResponse,
    InformationGainResponse,
    ChildSplitResult,
    ChildSplitData
)

class TreeExplainer:
    """Calculates impurity metrics with detailed step-by-step student explanations."""

    @staticmethod
    def _normalize_counts(class_counts: Union[Dict[str, int], List[int]]) -> Dict[str, int]:
        """Convert list or dict of class counts into standardized dictionary."""
        if not class_counts:
            raise ValueError("Class counts cannot be empty.")
        if isinstance(class_counts, list):
            res = {f"Class_{i}": int(cnt) for i, cnt in enumerate(class_counts)}
        else:
            res = {str(k): int(v) for k, v in class_counts.items()}
        for k, v in res.items():
            if v < 0:
                raise ValueError(f"Class count for '{k}' cannot be negative: {v}")
        if sum(res.values()) <= 0:
            raise ValueError("Total sample count must be greater than zero.")
        return res

    @staticmethod
    def calculate_gini(raw_counts: Union[Dict[str, int], List[int]]) -> GiniResponse:
        counts = TreeExplainer._normalize_counts(raw_counts)
        total = sum(counts.values())

        if total <= 0:
            raise ValueError("Total sample count must be greater than zero.")

        probs: Dict[str, float] = {}
        squared_probs: List[float] = []
        steps: List[str] = []

        steps.append(f"1. Total samples N = {' + '.join(str(c) for c in counts.values())} = {total}")

        prob_calc_strings = []
        for c_name, cnt in counts.items():
            p = cnt / total
            probs[c_name] = round(p, 4)
            p_sq = p ** 2
            squared_probs.append(p_sq)
            prob_calc_strings.append(f"p({c_name}) = {cnt}/{total} = {round(p, 4)}")

        steps.append(f"2. Class probabilities: {', '.join(prob_calc_strings)}")

        sum_sq = sum(squared_probs)
        sq_strings = [f"({probs[c_name]})^2 = {round(p_sq, 4)}" for c_name, p_sq in zip(counts.keys(), squared_probs)]
        steps.append(f"3. Sum of squared probabilities: {' + '.join(sq_strings)} = {round(sum_sq, 4)}")

        gini = 1.0 - sum_sq
        gini = max(0.0, round(gini, 4))
        steps.append(f"4. Gini Impurity = 1 - sum(p_i^2) = 1 - {round(sum_sq, 4)} = {gini}")

        if gini == 0.0:
            interp = "Pure Node (Gini = 0.0): All samples belong to a single class. No split needed."
        elif gini > 0.45:
            interp = f"High Impurity (Gini = {gini}): Samples are evenly mixed across classes. A split will likely yield high information gain."
        else:
            interp = f"Moderate Impurity (Gini = {gini}): One dominant class with some mixed samples."

        return GiniResponse(
            class_counts=counts,
            total_samples=total,
            probabilities=probs,
            sum_squared_probabilities=round(sum_sq, 4),
            gini_impurity=gini,
            formula="Gini = 1 - sum(p_i^2)",
            steps=steps,
            interpretation=interp
        )

    @staticmethod
    def calculate_entropy(raw_counts: Union[Dict[str, int], List[int]]) -> EntropyResponse:
        counts = TreeExplainer._normalize_counts(raw_counts)
        total = sum(counts.values())

        if total <= 0:
            raise ValueError("Total sample count must be greater than zero.")

        probs: Dict[str, float] = {}
        entropy_terms: List[float] = []
        steps: List[str] = []

        steps.append(f"1. Total samples N = {' + '.join(str(c) for c in counts.values())} = {total}")

        term_strings = []
        for c_name, cnt in counts.items():
            if cnt == 0:
                p = 0.0
                term = 0.0
                term_strings.append(f"p({c_name})*log2(p) = 0 (by limit convention 0*log2(0)=0)")
            else:
                p = cnt / total
                term = p * math.log2(p)
                term_strings.append(f"{round(p, 4)} * log2({round(p, 4)}) = {round(term, 4)}")

            probs[c_name] = round(p, 4)
            entropy_terms.append(term)

        steps.append("2. Individual entropy terms: " + ", ".join(term_strings))

        raw_entropy = -sum(entropy_terms)
        entropy = max(0.0, round(raw_entropy, 4))
        steps.append(f"3. Entropy = -sum(p_i * log2(p_i)) = -({round(sum(entropy_terms), 4)}) = {entropy}")

        if entropy == 0.0:
            interp = "Pure Node (Entropy = 0.0 bits): Perfect certainty. No uncertainty remains."
        elif entropy >= 1.0:
            interp = f"High Uncertainty (Entropy = {entropy} bits): High informational disorder. Samples are heavily dispersed."
        else:
            interp = f"Moderate Uncertainty (Entropy = {entropy} bits)."

        return EntropyResponse(
            class_counts=counts,
            total_samples=total,
            probabilities=probs,
            entropy=entropy,
            formula="Entropy = -sum(p_i * log2(p_i))",
            steps=steps,
            interpretation=interp
        )

    @staticmethod
    def calculate_information_gain(
        parent_counts: Union[Dict[str, int], List[int]],
        children: List[ChildSplitData],
        criterion: str = "entropy"
    ) -> InformationGainResponse:
        crit = criterion.lower().strip()
        if crit not in ("entropy", "gini"):
            crit = "entropy"

        # Calculate parent impurity
        if crit == "entropy":
            parent_res = TreeExplainer.calculate_entropy(parent_counts)
            parent_impurity = parent_res.entropy
            formula_name = "Entropy"
        else:
            parent_res = TreeExplainer.calculate_gini(parent_counts)
            parent_impurity = parent_res.gini_impurity
            formula_name = "Gini"

        total_parent_samples = parent_res.total_samples
        steps: List[str] = []
        steps.append(f"1. Parent Node {formula_name} = {parent_impurity} (Total samples: {total_parent_samples})")

        children_results: List[ChildSplitResult] = []
        weighted_terms: List[float] = []
        weighted_term_strings: List[str] = []

        total_child_samples = 0

        for child in children:
            c_counts = TreeExplainer._normalize_counts(child.class_counts)
            c_samples = sum(c_counts.values())
            total_child_samples += c_samples

            if crit == "entropy":
                c_res = TreeExplainer.calculate_entropy(c_counts)
                c_impurity = c_res.entropy
                c_probs = c_res.probabilities
            else:
                c_res = TreeExplainer.calculate_gini(c_counts)
                c_impurity = c_res.gini_impurity
                c_probs = c_res.probabilities

            weight = c_samples / total_parent_samples if total_parent_samples > 0 else 0.0
            term = weight * c_impurity
            weighted_terms.append(term)

            weighted_term_strings.append(
                f"({c_samples}/{total_parent_samples}) * {c_impurity} = {round(term, 4)}"
            )

            children_results.append(
                ChildSplitResult(
                    child_name=child.child_name,
                    class_counts=c_counts,
                    sample_count=c_samples,
                    weight=round(weight, 4),
                    impurity_value=c_impurity,
                    probabilities=c_probs
                )
            )

        steps.append("2. Child Nodes Impurities:")
        for cr in children_results:
            steps.append(f"   • {cr.child_name}: {cr.sample_count} samples (weight={cr.weight}), {formula_name}={cr.impurity_value}")

        weighted_child_impurity = round(sum(weighted_terms), 4)
        steps.append(f"3. Weighted Child {formula_name} = {' + '.join(weighted_term_strings)} = {weighted_child_impurity}")

        ig = round(parent_impurity - weighted_child_impurity, 4)
        steps.append(f"4. Information Gain = Parent {formula_name} - Weighted Child {formula_name} = {parent_impurity} - {weighted_child_impurity} = {ig}")

        if ig > 0.3:
            verdict = f"Excellent split! Produces high Information Gain ({ig}), significantly purifying the subset."
        elif ig > 0.05:
            verdict = f"Moderate split (Information Gain = {ig}). Provides a meaningful reduction in uncertainty."
        else:
            verdict = f"Weak split (Information Gain = {ig}). Barely improves class separation."

        return InformationGainResponse(
            criterion=crit,
            parent_impurity=parent_impurity,
            parent_counts=parent_res.class_counts,
            total_samples=total_parent_samples,
            children=children_results,
            weighted_child_impurity=weighted_child_impurity,
            information_gain=ig,
            step_by_step_explanation=steps,
            evaluation_verdict=verdict
        )
