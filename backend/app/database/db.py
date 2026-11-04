"""
Database setup, session factory, and initialization.
"""
import os
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session
from app.database.models import Base, DatasetModel
import pandas as pd

# Default SQLite database path
DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DEFAULT_DB_PATH = os.path.join(DB_DIR, "padh_le_bc.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enable foreign key constraints for SQLite connections."""
    if "sqlite" in DATABASE_URL:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a SQLAlchemy database session and ensures proper closure.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db() -> None:
    """
    Initialize SQLite database tables and seed sample datasets if not already seeded.
    """
    Base.metadata.create_all(bind=engine)
    seed_sample_datasets()

def seed_sample_datasets() -> None:
    """
    Seed built-in sample datasets into the database so students can start exploring immediately.
    """
    db = SessionLocal()
    try:
        sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "datasets", "sample"))
        if not os.path.exists(sample_dir):
            return

        sample_configs = [
            {
                "id": "sample_iris",
                "name": "Iris Flower Classification",
                "filename": "iris.csv",
                "target_column": "species",
                "task_type": "classification"
            },
            {
                "id": "sample_wine",
                "name": "Wine Recognition",
                "filename": "wine.csv",
                "target_column": "wine_class",
                "task_type": "classification"
            },
            {
                "id": "sample_breast_cancer",
                "name": "Breast Cancer Diagnostic",
                "filename": "breast_cancer.csv",
                "target_column": "diagnosis",
                "task_type": "classification"
            },
            {
                "id": "sample_diabetes",
                "name": "Diabetes Disease Progression",
                "filename": "diabetes.csv",
                "target_column": "disease_progression",
                "task_type": "regression"
            },
            {
                "id": "sample_student_performance",
                "name": "Student Exam Performance",
                "filename": "student_performance.csv",
                "target_column": "passed_exam",
                "task_type": "classification"
            },
            {
                "id": "sample_tech_salaries",
                "name": "Tech Salary Prediction",
                "filename": "tech_salaries.csv",
                "target_column": "salary_lpa",
                "task_type": "regression"
            }
        ]

        for config in sample_configs:
            file_path = os.path.join(sample_dir, config["filename"])
            if not os.path.exists(file_path):
                continue

            existing = db.query(DatasetModel).filter(DatasetModel.id == config["id"]).first()
            if not existing:
                try:
                    df = pd.read_csv(file_path)
                    dataset = DatasetModel(
                        id=config["id"],
                        name=config["name"],
                        filename=config["filename"],
                        file_path=file_path,
                        row_count=len(df),
                        column_count=len(df.columns),
                        target_column=config["target_column"],
                        task_type=config["task_type"],
                        is_sample=True
                    )
                    db.add(dataset)
                    db.commit()
                except Exception as e:
                    db.rollback()
                    print(f"Error seeding sample dataset {config['id']}: {e}")
    finally:
        db.close()
