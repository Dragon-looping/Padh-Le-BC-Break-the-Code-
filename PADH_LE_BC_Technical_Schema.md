# PADH LE BC (Break the Code)

## Mini-Project Technical Schema

**Project type:** Interactive Machine Learning Learning Lab + Model
Selection Assistant\
**Team size:** 2 developers\
**Frontend:** React + TypeScript + Tailwind CSS\
**Backend:** Python + FastAPI\
**ML stack:** Scikit-learn, Pandas, NumPy\
**Database:** SQLite\
**Initial input format:** CSV

------------------------------------------------------------------------

## 1. Project Overview

PADH LE BC is a web-based platform that helps students understand
machine-learning algorithms and apply them to real datasets.

It combines two experiences:

1.  **ML Learning Lab:** Students learn algorithms from scratch using
    structured explanations, visualisations, examples and interactive
    experiments.
2.  **Model Selection Assistant:** Students upload datasets, analyse
    their structure, train multiple algorithms, compare performance and
    receive evidence-based recommendations.

The key workflow connects theory to practice. A student learning
Decision Trees can study Gini impurity, upload a dataset, train a
Decision Tree alongside other algorithms, compare results and experiment
with tree depth.

### Main objectives

-   Explain fundamental ML concepts in a beginner-friendly way.
-   Allow students to upload and inspect CSV datasets.
-   Support classification and regression workflows.
-   Train and compare multiple ML algorithms fairly.
-   Display suitable evaluation metrics and visualisations.
-   Recommend candidate algorithms and explain the reasons.
-   Let students change hyperparameters and observe their effects.

## 2. High-Level Architecture

``` text
                         STUDENT
                            |
                            v
                 REACT + TYPESCRIPT FRONTEND
                            |
                     REST API / JSON
                            |
                            v
                     FASTAPI BACKEND
                            |
          +-----------------+------------------+
          |                 |                  |
          v                 v                  v
   DATASET MODULE      LEARNING MODULE    EXPERIMENT MODULE
          |                 |                  |
          v                 v                  v
   DATA ANALYSER       LESSON CONTENT      MODEL TRAINER
          |                                    |
          v                                    v
   PREPROCESSING                         MODEL REGISTRY
          |                                    |
          +----------------+-------------------+
                           |
                           v
                    EVALUATION ENGINE
                           |
               +-----------+-----------+
               |                       |
               v                       v
        MODEL COMPARATOR         MODEL ADVISOR
               |                       |
               +-----------+-----------+
                           |
                           v
                 EXPLANATION ENGINE
                           |
                           v
                   RESULTS TO FRONTEND

       SQLITE: metadata, experiment history and results
       FILE STORAGE: uploaded CSV files and generated artefacts
```

Start with a **modular monolithic FastAPI application**. Microservices
are unnecessary for this mini-project.

## 3. Functional Modules

### 3.1 Dashboard

-   Project introduction and navigation.
-   Entry points to Learning Lab, Dataset Explorer and Model Arena.
-   Recently opened lessons.
-   Recent experiments and results.

### 3.2 Learning Lab

  -----------------------------------------------------------------------
  Category                            Topics
  ----------------------------------- -----------------------------------
  Regression                          Simple Linear Regression, Multiple
                                      Linear Regression, least squares

  Classification                      Logistic Regression, KNN

  Tree-based models                   Decision Tree, Gini impurity,
                                      entropy

  Ensemble learning                   Bagging, Random Forest, Boosting

  Preprocessing                       Missing values, encoding,
                                      standardisation, normalisation

  Evaluation                          Accuracy, precision, recall, F1,
                                      MAE, MSE, RMSE

  Validation                          Train/test split, validation,
                                      cross-validation

  Model behaviour                     Bias, variance, overfitting,
                                      underfitting, regularisation
  -----------------------------------------------------------------------

Every algorithm lesson should cover: 1. What the algorithm is. 2. Why it
is used. 3. How it works. 4. Mathematical explanation. 5. Worked
example. 6. Interactive visualisation. 7. Advantages and limitations. 8.
When to use it and when not to use it. 9. Comparison with related
algorithms. 10. Practical experiment using a dataset.

### 3.3 Dataset Explorer

-   Upload CSV files and preview records.
-   Display row and column counts.
-   Identify numerical and categorical columns.
-   Detect missing values and duplicates.
-   Display descriptive statistics and class distributions.
-   Let the student select the target column and confirm classification
    or regression.
-   Allow columns to be excluded.
-   Warn about possible identifiers, leakage and unsuitable targets.

Do not automatically assume that the final column is the target.

### 3.4 Model Arena

**Classification:** Logistic Regression, KNN, Decision Tree Classifier,
Random Forest Classifier, Gradient Boosting Classifier.

**Regression:** Linear Regression, Decision Tree Regressor, Random
Forest Regressor, Gradient Boosting Regressor.

Students select algorithms and run them on the same dataset using
consistent experimental conditions.

### 3.5 Model Advisor

The advisor has two stages:

-   **Before training:** Recommend candidate algorithms based on dataset
    characteristics such as task type, sample count, feature types,
    class count, missing values and class imbalance.
-   **After training:** Rank candidates using measured cross-validation
    and test performance, generalisation gap, training time, complexity
    and the student's selected priority.

Recommendations must explain their reasoning. Do not claim that one
algorithm is universally best.

### 3.6 Experiment Studio

Example Decision Tree parameters:

  Parameter             Purpose
  --------------------- ------------------------------------------------
  `max_depth`           Maximum tree depth
  `min_samples_split`   Minimum samples required to split
  `min_samples_leaf`    Minimum samples at a leaf
  `criterion`           Split quality measure, such as Gini or entropy

Show the effect on training score, validation score, test score and
model complexity.

### 3.7 Results and Reports

-   Model comparison table.
-   Confusion matrix for classification.
-   Accuracy, precision, recall and F1-score.
-   MAE, MSE, RMSE and R² for regression.
-   Cross-validation mean and standard deviation.
-   Training and prediction time.
-   Feature importance where supported.
-   Experiment report.

## 4. Technology Stack

  Layer           Technology                   Responsibility
  --------------- ---------------------------- ---------------------------------
  Frontend        React + Vite                 Web application
  Language        TypeScript                   Frontend types
  Styling         Tailwind CSS                 UI
  Charts          Recharts                     Metric charts
  Routing         React Router                 Page navigation
  HTTP client     Axios                        API requests
  Backend         FastAPI                      REST APIs
  ML              Scikit-learn                 Model training and evaluation
  Data            Pandas + NumPy               Dataset processing
  Visualisation   Plotly / Matplotlib          ML visualisations
  Database        SQLite                       Metadata and experiment history
  File storage    Local filesystem initially   Uploaded CSV files

## 5. Team Division

### Developer 1 --- Frontend

**Responsibilities:** User interface, interactions, visualisations and
API integration.

  Module               Tasks
  -------------------- ----------------------------------------------
  Dashboard            Landing page, navigation, recent experiments
  Learning Lab         Lesson pages and algorithm explanations
  Algorithm Explorer   Algorithm details and comparisons
  Dataset Explorer     Upload, preview, target selection
  Model Arena          Algorithm selection and experiment controls
  Results Dashboard    Metrics, charts and confusion matrix
  Experiment Studio    Hyperparameter controls
  Model Advisor        Recommendation and explanation display

#### Frontend folder structure

``` text
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MetricCard.tsx
│   │   ├── ModelCard.tsx
│   │   ├── ComparisonChart.tsx
│   │   └── ConfusionMatrix.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── LearningLab.tsx
│   │   ├── AlgorithmDetails.tsx
│   │   ├── DatasetExplorer.tsx
│   │   ├── ModelArena.tsx
│   │   ├── Results.tsx
│   │   └── ExperimentStudio.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   ├── data/
│   │   └── lessons.ts
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

**Frontend deliverables:** Responsive layout, core pages, upload and
preview UI, model selection, result charts, learning content, API
integration and loading/error states.

The frontend developer can use mock JSON responses until backend
endpoints are ready.

### Developer 2 --- Backend and ML

**Responsibilities:** APIs, data processing, model training, evaluation
and recommendation logic.

  Module                 Tasks
  ---------------------- ----------------------------------------------
  Dataset Manager        Upload, validate and store CSV
  Dataset Analyzer       Feature types, missing values and statistics
  Task Detector          Classification/regression configuration
  Preprocessing Engine   Imputation, encoding and scaling
  Model Registry         Supported model definitions
  Model Trainer          Train selected algorithms
  Evaluation Engine      Calculate metrics
  Model Comparator       Compare models consistently
  Model Advisor          Recommend candidate algorithms
  Explanation Engine     Explain results and recommendations
  Experiment Manager     Save and retrieve experiments

#### Backend folder structure

``` text
backend/
├── app/
│   ├── main.py
│   ├── routes/
│   │   ├── datasets.py
│   │   ├── models.py
│   │   ├── experiments.py
│   │   └── lessons.py
│   ├── core/
│   │   ├── dataset_manager.py
│   │   ├── dataset_analyzer.py
│   │   ├── task_detector.py
│   │   ├── preprocessing.py
│   │   ├── model_registry.py
│   │   ├── trainer.py
│   │   ├── evaluator.py
│   │   ├── comparator.py
│   │   ├── recommender.py
│   │   └── explainer.py
│   ├── lessons/
│   │   ├── decision_tree.json
│   │   ├── knn.json
│   │   ├── logistic_regression.json
│   │   └── random_forest.json
│   ├── database/
│   │   └── db.py
│   └── schemas/
│       ├── dataset.py
│       └── experiment.py
├── datasets/
├── tests/
└── requirements.txt
```

**Backend deliverables:** Working FastAPI server, CSV upload and
validation, dataset profiling, preprocessing pipelines, classification
and regression training, model evaluation, recommendation engine,
experiment persistence, API documentation and tests.

## 6. API Contract

Both developers must agree on endpoint paths and data formats before
implementation.

  Endpoint                         Method   Purpose
  -------------------------------- -------- --------------------------
  `/api/datasets/upload`           POST     Upload CSV
  `/api/datasets`                  GET      List datasets
  `/api/datasets/{id}/profile`     GET      Dataset analysis
  `/api/datasets/{id}/configure`   POST     Select target and task
  `/api/models/recommend`          POST     Get candidate algorithms
  `/api/experiments/run`           POST     Train selected models
  `/api/experiments/{id}`          GET      Retrieve results
  `/api/experiments/{id}/tune`     POST     Run parameter experiment
  `/api/lessons/{algorithm}`       GET      Retrieve lesson content
  `/api/experiments/{id}/report`   GET      Retrieve report

### 6.1 Dataset upload

Request: `multipart/form-data` containing a CSV file.

Example response:

``` json
{
  "dataset_id": "ds_001",
  "filename": "student_data.csv",
  "rows": 500,
  "columns": 6,
  "status": "uploaded"
}
```

### 6.2 Dataset profile

``` json
{
  "dataset_id": "ds_001",
  "columns": [
    {
      "name": "study_hours",
      "type": "numerical",
      "missing_values": 0
    },
    {
      "name": "placement",
      "type": "categorical",
      "missing_values": 2
    }
  ],
  "preview": [],
  "target_candidates": ["placement"]
}
```

### 6.3 Run model comparison

Example request:

``` json
{
  "dataset_id": "ds_001",
  "target_column": "placement",
  "task_type": "classification",
  "models": [
    "logistic_regression",
    "knn",
    "decision_tree",
    "random_forest"
  ],
  "test_size": 0.2,
  "random_state": 42,
  "cross_validation_folds": 5
}
```

Example response:

``` json
{
  "experiment_id": "exp_001",
  "task": "classification",
  "results": [
    {
      "model": "decision_tree",
      "accuracy": 0.86,
      "precision": 0.84,
      "recall": 0.85,
      "f1_score": 0.845,
      "cv_mean": 0.83,
      "cv_std": 0.02
    }
  ],
  "recommendation": {
    "model": "decision_tree",
    "reason": "Good validation performance and interpretable decision rules."
  }
}
```

The metric values are illustrative contract examples, not measured
results.

## 7. ML Implementation Plan

### 7.1 Dataset analysis

Calculate row and column counts, numerical and categorical features,
missing values, duplicates, descriptive statistics, target cardinality
and distribution, class imbalance and numerical correlations.

The user must confirm the target column and task type.

### 7.2 Preprocessing

Use Scikit-learn `Pipeline` and `ColumnTransformer`.

  Feature type                            Processing
  --------------------------------------- -----------------------------
  Numerical                               Median imputation
  Categorical                             Most-frequent imputation
  Categorical                             One-hot encoding
  Numerical for KNN/Logistic Regression   Standardisation
  Numerical for tree models               Scaling usually unnecessary

Fit preprocessing only on training data to prevent data leakage.

### 7.3 Model registry

Initial classification models:

``` python
CLASSIFICATION_MODELS = {
    "logistic_regression": LogisticRegression(max_iter=1000),
    "knn": KNeighborsClassifier(),
    "decision_tree": DecisionTreeClassifier(random_state=42),
    "random_forest": RandomForestClassifier(random_state=42),
    "gradient_boosting": GradientBoostingClassifier(random_state=42)
}
```

Initial regression models:

-   Linear Regression
-   Decision Tree Regressor
-   Random Forest Regressor
-   Gradient Boosting Regressor

### 7.4 Evaluation

Classification: accuracy, precision, recall, F1-score and confusion
matrix.

Regression: MAE, MSE, RMSE and R².

Also record cross-validation mean and standard deviation, training time
and generalisation gap.

Use the same split and compatible preprocessing for every model in a
comparison. Keep the final test set separate from model selection and
tuning.

### 7.5 Recommendation logic

Start with transparent rules, not a complicated neural network.

Consider task type, dataset size, feature count, feature types, number
of classes, class imbalance, missing values, interpretability
requirements and measured validation performance.

The advisor should suggest candidates, explain trade-offs and avoid
claiming that any algorithm is always best.

### 7.6 Explanation logic

Use structured lesson content and result-based explanation templates.

Example:

> Your Decision Tree achieved 100% training accuracy but 78% test
> accuracy. This gap suggests possible overfitting. Try reducing maximum
> depth or increasing minimum samples per leaf.

## 8. Dataset Strategy

Provide curated datasets so students can use the platform immediately.

  -----------------------------------------------------------------------
  Dataset                 Task                    Demonstrates
  ----------------------- ----------------------- -----------------------
  Iris                    Multiclass              KNN, Decision Tree,
                          classification          Logistic Regression

  Breast Cancer Wisconsin Binary classification   Classification metrics
  Diagnostic                                      and Random Forest

  Wine                    Multiclass              Scaling and model
                          classification          comparison

  California Housing      Regression              Linear and tree-based
                                                  regression

  Diabetes                Regression              Regression metrics

  Synthetic               Classification          Decision boundaries and
  classification dataset                          overfitting
  -----------------------------------------------------------------------

Sources:

-   Scikit-learn: https://scikit-learn.org/stable/datasets.html
-   UCI Repository: https://archive.ics.uci.edu/
-   Kaggle: https://www.kaggle.com/datasets

Support CSV first. Add Excel, image and time-series datasets only in
later versions.

## 9. Database Schema

Use SQLite initially.

### `datasets`

  Field          Type               Description
  -------------- ------------------ ----------------------
  id             TEXT PRIMARY KEY   Dataset ID
  name           TEXT               Display name
  filename       TEXT               Uploaded filename
  file_path      TEXT               Stored file location
  row_count      INTEGER            Number of rows
  column_count   INTEGER            Number of columns
  created_at     DATETIME           Upload time

### `experiments`

  Field           Type               Description
  --------------- ------------------ ---------------------------
  id              TEXT PRIMARY KEY   Experiment ID
  dataset_id      TEXT               Associated dataset
  target_column   TEXT               Selected target
  task_type       TEXT               Classification/regression
  test_size       REAL               Test split proportion
  random_state    INTEGER            Reproducibility
  created_at      DATETIME           Experiment time

### `model_results`

  Field             Type                  Description
  ----------------- --------------------- -----------------------
  id                INTEGER PRIMARY KEY   Result ID
  experiment_id     TEXT                  Associated experiment
  model_name        TEXT                  Algorithm
  metrics_json      TEXT                  Evaluation metrics
  parameters_json   TEXT                  Model parameters
  training_time     REAL                  Training duration

Store CSV files separately. Store metadata and results in SQLite.

## 10. Development Roadmap

Target duration: approximately 5 weeks.

  -----------------------------------------------------------------------
  Week                    Frontend developer      Backend/ML developer
  ----------------------- ----------------------- -----------------------
  1                       Project setup,          FastAPI setup, CSV
                          dashboard, navigation,  upload, dataset
                          mock data               profiling

  2                       Dataset Explorer and    Preprocessing, first
                          upload integration      five algorithms,
                                                  metrics

  3                       Model Arena, comparison Model Advisor,
                          charts, result pages    cross-validation,
                                                  experiment storage

  4                       Learning Lab, tree      Lesson APIs, Gini
                          visualisation,          calculations, tuning
                          parameter controls      endpoints

  5                       Integration, responsive Testing, validation,
                          UI, error states        API fixes, report
                                                  generation
  -----------------------------------------------------------------------

### Integration milestones

1.  Upload a CSV from the frontend.
2.  Display its profile.
3.  Select a target column.
4.  Request model recommendations.
5.  Train three models.
6.  Display real comparison results.
7.  Change a hyperparameter and rerun.
8.  Link the result to the relevant Learning Lab lesson.

Integrate continuously. Do not wait until each developer has completed
their entire module.

## 11. Git and Collaboration Workflow

Use one shared GitHub repository.

``` text
PADH-LE-BC/
├── frontend/
├── backend/
├── docs/
│   ├── architecture.md
│   ├── api-contract.md
│   └── dataset-guide.md
├── README.md
└── .gitignore
```

Suggested branches:

-   `main` --- stable version.
-   `frontend` --- frontend development.
-   `backend` --- backend development.

Suggested commit messages:

``` text
feat(frontend): add learning lab dashboard
feat(backend): implement dataset profiling
feat(ml): add decision tree classifier
fix(api): handle missing target values
```

Keep API contracts in `docs/api-contract.md`. Update them only when both
developers agree.

## 12. MVP Scope

### Must have

-   Dashboard.
-   Learning Lab.
-   CSV upload.
-   Dataset profiling.
-   Target selection.
-   Classification and regression support.
-   Logistic Regression.
-   KNN.
-   Decision Tree.
-   Random Forest.
-   Linear Regression.
-   Model comparison.
-   Classification and regression metrics.
-   Gini impurity visualisation.
-   Basic recommendation engine.

### Should have

-   Gradient Boosting.
-   Cross-validation comparisons.
-   Hyperparameter experiments.
-   Feature importance.
-   Downloadable experiment reports.

### Future extensions

-   User accounts.
-   AI tutor.
-   More algorithms.
-   Automated hyperparameter tuning.
-   Trained meta-learning recommendation model.
-   Student progress tracking and quizzes.

Avoid building login systems or an AI chatbot before the core ML
workflow works.

## 13. Final Demonstration Scenario

1.  Student opens PADH LE BC.
2.  Selects Decision Tree in Learning Lab.
3.  Learns Gini impurity using an interactive example.
4.  Opens the Iris dataset.
5.  Selects `species` as the target.
6.  Trains Decision Tree, KNN and Logistic Regression.
7.  Compares actual model performance.
8.  Changes Decision Tree maximum depth.
9.  Observes training and test performance change.
10. Receives a recommendation with an explanation.

**Success criterion:** The student understands not only which model
performed well, but why the algorithms behave differently.

## 14. Immediate Starting Tasks

### Frontend developer

-   [ ] Create React + Vite + TypeScript project.
-   [ ] Configure Tailwind CSS.
-   [ ] Create dashboard layout.
-   [ ] Add navigation and routes.
-   [ ] Build Dataset Explorer using mock JSON.
-   [ ] Create the API service layer.

### Backend developer

-   [ ] Create FastAPI project.
-   [ ] Configure CORS.
-   [ ] Implement CSV upload.
-   [ ] Implement dataset profiling.
-   [ ] Train Logistic Regression, KNN and Decision Tree on Iris.
-   [ ] Return evaluation metrics as JSON.
-   [ ] Document endpoints in Swagger.

### Both developers

-   [ ] Create shared GitHub repository.
-   [ ] Agree on API contracts.
-   [ ] Use the same Iris dataset for the first integration test.
-   [ ] Review progress daily.
-   [ ] Keep the README and architecture documentation updated.

## 15. Final Project Principle

**Build the ML engine before polishing the UI.**

The first working milestone should be one CSV upload, three genuinely
trained models, one consistent evaluation process, one comparison screen
and one explanation of the results.

Once this works end-to-end, expand the Learning Lab and the rest of the
platform.

**PADH LE BC --- Break the Code. Learn the algorithm. Understand the
result. Choose with confidence.**
