"""
Script to generate and bundle sample datasets for offline use in PADH LE BC.
"""
import os
import pandas as pd
from sklearn.datasets import load_iris, load_wine, load_breast_cancer, load_diabetes, make_classification, make_regression

def generate_samples(output_dir: str):
    os.makedirs(output_dir, exist_ok=True)

    # 1. Iris
    iris = load_iris(as_frame=True)
    df_iris = iris.frame.copy()
    # Replace target with class names for educational readability
    df_iris["species"] = df_iris["target"].map({i: name for i, name in enumerate(iris.target_names)})
    df_iris.drop(columns=["target"], inplace=True)
    # Clean column names
    df_iris.columns = [c.replace(" (cm)", "").replace(" ", "_") for c in df_iris.columns]
    iris_path = os.path.join(output_dir, "iris.csv")
    df_iris.to_csv(iris_path, index=False)
    print(f"Generated {iris_path}: {df_iris.shape}")

    # 2. Wine
    wine = load_wine(as_frame=True)
    df_wine = wine.frame.copy()
    df_wine["wine_class"] = df_wine["target"].map({i: f"class_{name}" for i, name in enumerate(wine.target_names)})
    df_wine.drop(columns=["target"], inplace=True)
    df_wine.columns = [c.replace("/", "_").replace(" ", "_") for c in df_wine.columns]
    wine_path = os.path.join(output_dir, "wine.csv")
    df_wine.to_csv(wine_path, index=False)
    print(f"Generated {wine_path}: {df_wine.shape}")

    # 3. Breast Cancer Wisconsin
    bc = load_breast_cancer(as_frame=True)
    df_bc = bc.frame.copy()
    df_bc["diagnosis"] = df_bc["target"].map({0: "malignant", 1: "benign"})
    df_bc.drop(columns=["target"], inplace=True)
    df_bc.columns = [c.replace(" ", "_") for c in df_bc.columns]
    bc_path = os.path.join(output_dir, "breast_cancer.csv")
    df_bc.to_csv(bc_path, index=False)
    print(f"Generated {bc_path}: {df_bc.shape}")

    # 4. Diabetes Regression
    diab = load_diabetes(as_frame=True)
    df_diab = diab.frame.copy()
    df_diab.rename(columns={"target": "disease_progression"}, inplace=True)
    diab_path = os.path.join(output_dir, "diabetes.csv")
    df_diab.to_csv(diab_path, index=False)
    print(f"Generated {diab_path}: {df_diab.shape}")

    # 5. Synthetic Classification (Educational study hours & attendance -> Pass/Fail)
    X_syn_c, y_syn_c = make_classification(
        n_samples=300,
        n_features=4,
        n_informative=3,
        n_redundant=1,
        n_classes=2,
        random_state=42
    )
    df_syn_c = pd.DataFrame(X_syn_c, columns=["study_hours_score", "attendance_rate", "assignment_score", "quiz_avg"])
    # Scale to realistic looking scores
    df_syn_c["study_hours_score"] = (df_syn_c["study_hours_score"] * 10 + 40).clip(0, 100).round(1)
    df_syn_c["attendance_rate"] = (df_syn_c["attendance_rate"] * 15 + 75).clip(0, 100).round(1)
    df_syn_c["assignment_score"] = (df_syn_c["assignment_score"] * 12 + 65).clip(0, 100).round(1)
    df_syn_c["quiz_avg"] = (df_syn_c["quiz_avg"] * 10 + 70).clip(0, 100).round(1)
    df_syn_c["passed_exam"] = ["passed" if y == 1 else "failed" for y in y_syn_c]
    syn_c_path = os.path.join(output_dir, "student_performance.csv")
    df_syn_c.to_csv(syn_c_path, index=False)
    print(f"Generated {syn_c_path}: {df_syn_c.shape}")

    # 6. Synthetic Regression (Housing / salary style)
    X_syn_r, y_syn_r = make_regression(
        n_samples=250,
        n_features=5,
        noise=5.0,
        random_state=42
    )
    df_syn_r = pd.DataFrame(X_syn_r, columns=["years_experience", "project_count", "certifications", "code_rating", "interview_score"])
    df_syn_r["years_experience"] = (df_syn_r["years_experience"] * 2.5 + 5).clip(0, 25).round(1)
    df_syn_r["project_count"] = (df_syn_r["project_count"] * 3 + 8).clip(1, 30).round(0).astype(int)
    df_syn_r["certifications"] = (df_syn_r["certifications"] * 1.5 + 2).clip(0, 10).round(0).astype(int)
    df_syn_r["code_rating"] = (df_syn_r["code_rating"] * 15 + 70).clip(10, 100).round(1)
    df_syn_r["interview_score"] = (df_syn_r["interview_score"] * 10 + 75).clip(20, 100).round(1)
    df_syn_r["salary_lpa"] = (y_syn_r * 0.15 + 18.0).clip(4.0, 60.0).round(2)
    syn_r_path = os.path.join(output_dir, "tech_salaries.csv")
    df_syn_r.to_csv(syn_r_path, index=False)
    print(f"Generated {syn_r_path}: {df_syn_r.shape}")

if __name__ == "__main__":
    generate_samples("backend/datasets/sample")
