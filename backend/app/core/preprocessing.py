"""
Preprocessing pipelines using Scikit-learn ColumnTransformer and Pipeline.
Guarantees clean separation between training and test sets to prevent data leakage.
"""
from typing import List, Tuple
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

def identify_feature_types(X: pd.DataFrame) -> Tuple[List[str], List[str]]:
    """
    Partition feature columns into numerical and categorical lists.
    """
    numerical_features: List[str] = []
    categorical_features: List[str] = []

    for col in X.columns:
        if pd.api.types.is_numeric_dtype(X[col]):
            numerical_features.append(col)
        else:
            categorical_features.append(col)

    return numerical_features, categorical_features

def build_preprocessor(
    numerical_cols: List[str],
    categorical_cols: List[str],
    scale_numeric: bool = True
) -> ColumnTransformer:
    """
    Build a Scikit-learn ColumnTransformer for numerical and categorical features.

    Parameters:
    - numerical_cols: list of numeric feature column names
    - categorical_cols: list of categorical/string feature column names
    - scale_numeric: whether to apply StandardScaler (needed for KNN, Logistic Regression, etc., but not tree models)
    """
    transformers = []

    # Numerical pipeline: median imputation + optional standard scaling
    if numerical_cols:
        num_steps = [("imputer", SimpleImputer(strategy="median"))]
        if scale_numeric:
            num_steps.append(("scaler", StandardScaler()))
        numerical_pipeline = Pipeline(steps=num_steps)
        transformers.append(("num", numerical_pipeline, numerical_cols))

    # Categorical pipeline: most frequent imputation + OneHotEncoder
    if categorical_cols:
        cat_pipeline = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
            ]
        )
        transformers.append(("cat", cat_pipeline, categorical_cols))

    return ColumnTransformer(transformers=transformers, remainder="drop")

def build_model_pipeline(
    model_estimator,
    numerical_cols: List[str],
    categorical_cols: List[str],
    scale_numeric: bool = True
) -> Pipeline:
    """
    Compose the complete end-to-end Pipeline combining preprocessing and the model estimator.
    """
    preprocessor = build_preprocessor(numerical_cols, categorical_cols, scale_numeric=scale_numeric)
    return Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", model_estimator)
    ])
