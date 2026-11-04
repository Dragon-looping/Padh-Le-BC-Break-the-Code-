"""
Central Model Registry: definitions, metadata, hyperparameter specs, and estimator factories.
Allows seamless addition of new algorithms without rewriting training or evaluation logic.
"""
from typing import Dict, Any, List, Optional
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import (
    RandomForestClassifier,
    RandomForestRegressor,
    GradientBoostingClassifier,
    GradientBoostingRegressor
)
from app.schemas.model import ModelInfo, HyperparameterSpec

class ModelRegistry:
    """Registry maintaining all supported classification and regression algorithms."""

    REGISTRY: Dict[str, Dict[str, Any]] = {
        # ================= CLASSIFICATION =================
        "logistic_regression": {
            "model_id": "logistic_regression",
            "display_name": "Logistic Regression",
            "task_type": "classification",
            "description": "Linear classifier modeling class probabilities using the logistic sigmoid function. Fast, stable, and highly interpretable.",
            "interpretability": "High",
            "training_speed": "Fast",
            "prediction_speed": "Fast",
            "requires_scaling": True,
            "is_tree_based": False,
            "default_parameters": {
                "C": 1.0,
                "max_iter": 1000,
                "solver": "lbfgs"
            },
            "supported_parameters": [
                HyperparameterSpec(
                    name="C",
                    type="float",
                    default=1.0,
                    min_value=0.001,
                    max_value=100.0,
                    description="Inverse regularization strength; smaller values specify stronger regularization."
                ),
                HyperparameterSpec(
                    name="max_iter",
                    type="int",
                    default=1000,
                    min_value=100,
                    max_value=5000,
                    description="Maximum number of solver optimization iterations taken to converge."
                ),
                HyperparameterSpec(
                    name="solver",
                    type="str",
                    default="lbfgs",
                    options=["lbfgs", "liblinear", "saga"],
                    description="Algorithm used in the optimization problem."
                )
            ],
            "factory": lambda params, random_state: LogisticRegression(
                C=float(params.get("C", 1.0)),
                max_iter=int(params.get("max_iter", 1000)),
                solver=str(params.get("solver", "lbfgs")),
                random_state=random_state
            )
        },

        "knn": {
            "model_id": "knn",
            "display_name": "K-Nearest Neighbours (KNN)",
            "task_type": "classification",
            "description": "Non-parametric instance-based classifier assigning labels based on majority vote of the K nearest training samples in feature space.",
            "interpretability": "Moderate",
            "training_speed": "Fast",
            "prediction_speed": "Slow",
            "requires_scaling": True,
            "is_tree_based": False,
            "default_parameters": {
                "n_neighbors": 5,
                "weights": "uniform",
                "metric": "minkowski"
            },
            "supported_parameters": [
                HyperparameterSpec(
                    name="n_neighbors",
                    type="int",
                    default=5,
                    min_value=1,
                    max_value=50,
                    description="Number of nearest neighbors to query for majority voting."
                ),
                HyperparameterSpec(
                    name="weights",
                    type="str",
                    default="uniform",
                    options=["uniform", "distance"],
                    description="Weight function used in prediction. 'uniform' assigns equal weight; 'distance' weights points by inverse distance."
                ),
                HyperparameterSpec(
                    name="metric",
                    type="str",
                    default="minkowski",
                    options=["minkowski", "euclidean", "manhattan"],
                    description="Distance metric used for calculating distances between data points."
                )
            ],
            "factory": lambda params, random_state: KNeighborsClassifier(
                n_neighbors=int(params.get("n_neighbors", 5)),
                weights=str(params.get("weights", "uniform")),
                metric=str(params.get("metric", "minkowski"))
            )
        },

        "decision_tree": {
            "model_id": "decision_tree",
            "display_name": "Decision Tree Classifier",
            "task_type": "classification",
            "description": "Hierarchical tree model partitioning feature space using optimal orthogonal splits based on Gini impurity or entropy.",
            "interpretability": "High",
            "training_speed": "Fast",
            "prediction_speed": "Fast",
            "requires_scaling": False,
            "is_tree_based": True,
            "default_parameters": {
                "criterion": "gini",
                "max_depth": 5,
                "min_samples_split": 2,
                "min_samples_leaf": 1
            },
            "supported_parameters": [
                HyperparameterSpec(
                    name="criterion",
                    type="str",
                    default="gini",
                    options=["gini", "entropy"],
                    description="The function to measure the quality of a split ('gini' or 'entropy')."
                ),
                HyperparameterSpec(
                    name="max_depth",
                    type="int",
                    default=5,
                    min_value=1,
                    max_value=30,
                    description="The maximum depth of the tree. Controls model complexity and prevents overfitting."
                ),
                HyperparameterSpec(
                    name="min_samples_split",
                    type="int",
                    default=2,
                    min_value=2,
                    max_value=50,
                    description="The minimum number of samples required to split an internal node."
                ),
                HyperparameterSpec(
                    name="min_samples_leaf",
                    type="int",
                    default=1,
                    min_value=1,
                    max_value=50,
                    description="The minimum number of samples required to be at a leaf node."
                )
            ],
            "factory": lambda params, random_state: DecisionTreeClassifier(
                criterion=str(params.get("criterion", "gini")),
                max_depth=int(params["max_depth"]) if params.get("max_depth") is not None else None,
                min_samples_split=int(params.get("min_samples_split", 2)),
                min_samples_leaf=int(params.get("min_samples_leaf", 1)),
                random_state=random_state
            )
        },

        "random_forest": {
            "model_id": "random_forest",
            "display_name": "Random Forest Classifier",
            "task_type": "classification",
            "description": "Ensemble of decorrelated decision trees built via bootstrap aggregating (bagging) and random feature subsets.",
            "interpretability": "Moderate",
            "training_speed": "Moderate",
            "prediction_speed": "Moderate",
            "requires_scaling": False,
            "is_tree_based": True,
            "default_parameters": {
                "n_estimators": 100,
                "max_depth": 10,
                "min_samples_split": 2
            },
            "supported_parameters": [
                HyperparameterSpec(
                    name="n_estimators",
                    type="int",
                    default=100,
                    min_value=10,
                    max_value=500,
                    description="The number of decision trees in the forest ensemble."
                ),
                HyperparameterSpec(
                    name="max_depth",
                    type="int",
                    default=10,
                    min_value=1,
                    max_value=30,
                    description="The maximum depth of individual trees."
                ),
                HyperparameterSpec(
                    name="min_samples_split",
                    type="int",
                    default=2,
                    min_value=2,
                    max_value=20,
                    description="The minimum number of samples required to split an internal node."
                )
            ],
            "factory": lambda params, random_state: RandomForestClassifier(
                n_estimators=int(params.get("n_estimators", 100)),
                max_depth=int(params["max_depth"]) if params.get("max_depth") is not None else None,
                min_samples_split=int(params.get("min_samples_split", 2)),
                random_state=random_state
            )
        },

        "gradient_boosting": {
            "model_id": "gradient_boosting",
            "display_name": "Gradient Boosting Classifier",
            "task_type": "classification",
            "description": "Sequential ensemble building trees greedily to minimize residual pseudo-errors using gradient descent in function space.",
            "interpretability": "Low",
            "training_speed": "Slow",
            "prediction_speed": "Fast",
            "requires_scaling": False,
            "is_tree_based": True,
            "default_parameters": {
                "n_estimators": 100,
                "learning_rate": 0.1,
                "max_depth": 3
            },
            "supported_parameters": [
                HyperparameterSpec(
                    name="n_estimators",
                    type="int",
                    default=100,
                    min_value=10,
                    max_value=300,
                    description="The number of boosting stages to perform."
                ),
                HyperparameterSpec(
                    name="learning_rate",
                    type="float",
                    default=0.1,
                    min_value=0.01,
                    max_value=1.0,
                    description="Learning rate shrinks the contribution of each tree."
                ),
                HyperparameterSpec(
                    name="max_depth",
                    type="int",
                    default=3,
                    min_value=1,
                    max_value=10,
                    description="Maximum depth of individual regression estimators in the boosting sequence."
                )
            ],
            "factory": lambda params, random_state: GradientBoostingClassifier(
                n_estimators=int(params.get("n_estimators", 100)),
                learning_rate=float(params.get("learning_rate", 0.1)),
                max_depth=int(params.get("max_depth", 3)),
                random_state=random_state
            )
        },

        # ================= REGRESSION =================
        "linear_regression": {
            "model_id": "linear_regression",
            "display_name": "Linear Regression",
            "task_type": "regression",
            "description": "Ordinary Least Squares linear regression fitting a hyperplane by minimizing the sum of squared residuals.",
            "interpretability": "High",
            "training_speed": "Fast",
            "prediction_speed": "Fast",
            "requires_scaling": True,
            "is_tree_based": False,
            "default_parameters": {
                "fit_intercept": True
            },
            "supported_parameters": [
                HyperparameterSpec(
                    name="fit_intercept",
                    type="bool",
                    default=True,
                    options=[True, False],
                    description="Whether to calculate the intercept for this model."
                )
            ],
            "factory": lambda params, random_state: LinearRegression(
                fit_intercept=bool(params.get("fit_intercept", True))
            )
        },

        "decision_tree_regressor": {
            "model_id": "decision_tree_regressor",
            "display_name": "Decision Tree Regressor",
            "task_type": "regression",
            "description": "Tree-structured regression partitioning feature space into rectangular regions, predicting region mean values.",
            "interpretability": "High",
            "training_speed": "Fast",
            "prediction_speed": "Fast",
            "requires_scaling": False,
            "is_tree_based": True,
            "default_parameters": {
                "max_depth": 5,
                "min_samples_split": 2,
                "min_samples_leaf": 1
            },
            "supported_parameters": [
                HyperparameterSpec(
                    name="max_depth",
                    type="int",
                    default=5,
                    min_value=1,
                    max_value=30,
                    description="The maximum depth of the regression tree."
                ),
                HyperparameterSpec(
                    name="min_samples_split",
                    type="int",
                    default=2,
                    min_value=2,
                    max_value=50,
                    description="Minimum samples needed to split an internal node."
                ),
                HyperparameterSpec(
                    name="min_samples_leaf",
                    type="int",
                    default=1,
                    min_value=1,
                    max_value=50,
                    description="Minimum samples needed at a leaf node."
                )
            ],
            "factory": lambda params, random_state: DecisionTreeRegressor(
                max_depth=int(params["max_depth"]) if params.get("max_depth") is not None else None,
                min_samples_split=int(params.get("min_samples_split", 2)),
                min_samples_leaf=int(params.get("min_samples_leaf", 1)),
                random_state=random_state
            )
        },

        "random_forest_regressor": {
            "model_id": "random_forest_regressor",
            "display_name": "Random Forest Regressor",
            "task_type": "regression",
            "description": "Ensemble of regression trees averaged together to significantly reduce variance without increasing bias.",
            "interpretability": "Moderate",
            "training_speed": "Moderate",
            "prediction_speed": "Moderate",
            "requires_scaling": False,
            "is_tree_based": True,
            "default_parameters": {
                "n_estimators": 100,
                "max_depth": 10,
                "min_samples_split": 2
            },
            "supported_parameters": [
                HyperparameterSpec(
                    name="n_estimators",
                    type="int",
                    default=100,
                    min_value=10,
                    max_value=500,
                    description="The number of trees in the forest."
                ),
                HyperparameterSpec(
                    name="max_depth",
                    type="int",
                    default=10,
                    min_value=1,
                    max_value=30,
                    description="The maximum depth of individual trees."
                ),
                HyperparameterSpec(
                    name="min_samples_split",
                    type="int",
                    default=2,
                    min_value=2,
                    max_value=20,
                    description="Minimum samples required to split an internal node."
                )
            ],
            "factory": lambda params, random_state: RandomForestRegressor(
                n_estimators=int(params.get("n_estimators", 100)),
                max_depth=int(params["max_depth"]) if params.get("max_depth") is not None else None,
                min_samples_split=int(params.get("min_samples_split", 2)),
                random_state=random_state
            )
        },

        "gradient_boosting_regressor": {
            "model_id": "gradient_boosting_regressor",
            "display_name": "Gradient Boosting Regressor",
            "task_type": "regression",
            "description": "Additive regression ensemble sequentially fitting base regression trees to the pseudo-residuals of the previous models.",
            "interpretability": "Low",
            "training_speed": "Slow",
            "prediction_speed": "Fast",
            "requires_scaling": False,
            "is_tree_based": True,
            "default_parameters": {
                "n_estimators": 100,
                "learning_rate": 0.1,
                "max_depth": 3
            },
            "supported_parameters": [
                HyperparameterSpec(
                    name="n_estimators",
                    type="int",
                    default=100,
                    min_value=10,
                    max_value=300,
                    description="The number of boosting stages to perform."
                ),
                HyperparameterSpec(
                    name="learning_rate",
                    type="float",
                    default=0.1,
                    min_value=0.01,
                    max_value=1.0,
                    description="Shrinks the contribution of each tree by learning_rate."
                ),
                HyperparameterSpec(
                    name="max_depth",
                    type="int",
                    default=3,
                    min_value=1,
                    max_value=10,
                    description="Maximum depth of individual regression trees."
                )
            ],
            "factory": lambda params, random_state: GradientBoostingRegressor(
                n_estimators=int(params.get("n_estimators", 100)),
                learning_rate=float(params.get("learning_rate", 0.1)),
                max_depth=int(params.get("max_depth", 3)),
                random_state=random_state
            )
        }
    }

    @classmethod
    def get_model(cls, model_id: str) -> Dict[str, Any]:
        """Retrieve model definition by model_id."""
        if model_id not in cls.REGISTRY:
            available = list(cls.REGISTRY.keys())
            raise ValueError(f"Model '{model_id}' is not registered. Available models: {available}")
        return cls.REGISTRY[model_id]

    @classmethod
    def list_models(cls, task_type: Optional[str] = None) -> List[ModelInfo]:
        """List all registered models, optionally filtered by task type."""
        models: List[ModelInfo] = []
        for m in cls.REGISTRY.values():
            if task_type and m["task_type"] != task_type:
                continue
            models.append(
                ModelInfo(
                    model_id=m["model_id"],
                    display_name=m["display_name"],
                    task_type=m["task_type"],
                    description=m["description"],
                    interpretability=m["interpretability"],
                    training_speed=m["training_speed"],
                    prediction_speed=m["prediction_speed"],
                    requires_scaling=m["requires_scaling"],
                    is_tree_based=m["is_tree_based"],
                    default_parameters=m["default_parameters"],
                    supported_parameters=m["supported_parameters"]
                )
            )
        return models

    @classmethod
    def validate_hyperparameters(cls, model_id: str, custom_params: Dict[str, Any]) -> None:
        """
        Validate custom hyperparameters against model specifications (names, bounds, options, types).
        """
        meta = cls.get_model(model_id)
        supported_specs = {p.name: p for p in meta["supported_parameters"]}

        for k, v in custom_params.items():
            if k not in supported_specs:
                valid_names = list(supported_specs.keys())
                raise ValueError(
                    f"Unsupported hyperparameter '{k}' for model '{meta['display_name']}'. "
                    f"Supported parameters are: {valid_names}"
                )

            spec = supported_specs[k]

            # Check options if specified
            if spec.options is not None and v not in spec.options:
                raise ValueError(
                    f"Invalid value '{v}' for hyperparameter '{k}'. "
                    f"Allowed options are: {spec.options}"
                )

            # Check bounds if numeric
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                if spec.min_value is not None and v < spec.min_value:
                    raise ValueError(
                        f"Hyperparameter '{k}' value ({v}) cannot be less than minimum allowed ({spec.min_value})."
                    )
                if spec.max_value is not None and v > spec.max_value:
                    raise ValueError(
                        f"Hyperparameter '{k}' value ({v}) cannot be greater than maximum allowed ({spec.max_value})."
                    )

    @classmethod
    def instantiate(cls, model_id: str, custom_params: Optional[Dict[str, Any]] = None, random_state: int = 42):
        """Instantiate a scikit-learn estimator using default + custom hyperparameters."""
        meta = cls.get_model(model_id)
        if custom_params:
            cls.validate_hyperparameters(model_id, custom_params)
        params = dict(meta["default_parameters"])
        if custom_params:
            for k, v in custom_params.items():
                params[k] = v
        return meta["factory"](params, random_state), params
