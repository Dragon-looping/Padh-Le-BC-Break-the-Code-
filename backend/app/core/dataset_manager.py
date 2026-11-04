"""
Dataset management: saving uploaded files, registering in SQLite, listing datasets.
"""
import os
import shutil
from typing import List, Optional
import pandas as pd
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.database.models import DatasetModel
from app.utils.file_utils import (
    ensure_directories,
    generate_dataset_id,
    sanitize_filename,
    UPLOAD_DIR,
    MAX_UPLOAD_SIZE_BYTES,
    load_csv_safely
)

class DatasetManager:
    """Handles dataset file storage and database records."""

    @staticmethod
    def save_upload(file: UploadFile, db: Session) -> DatasetModel:
        """
        Validate, save uploaded CSV file, and register in database.
        """
        ensure_directories()

        if not file.filename:
            raise HTTPException(status_code=400, detail="Uploaded file has no filename.")

        if not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only CSV files (.csv) are currently supported.")

        dataset_id = generate_dataset_id()
        sanitized_name = sanitize_filename(file.filename)
        destination_filename = f"{dataset_id}_{sanitized_name}"
        destination_path = os.path.join(UPLOAD_DIR, destination_filename)

        total_bytes = 0
        try:
            with open(destination_path, "wb") as buffer:
                while True:
                    chunk = file.file.read(1024 * 1024)  # 1MB chunks
                    if not chunk:
                        break
                    total_bytes += len(chunk)
                    if total_bytes > MAX_UPLOAD_SIZE_BYTES:
                        raise HTTPException(
                            status_code=413,
                            detail=f"File exceeds maximum allowed size of {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB."
                        )
                    buffer.write(chunk)
        except HTTPException:
            if os.path.exists(destination_path):
                os.remove(destination_path)
            raise
        except Exception as e:
            if os.path.exists(destination_path):
                os.remove(destination_path)
            raise HTTPException(status_code=500, detail=f"Failed to write uploaded file to disk: {str(e)}")

        if total_bytes == 0:
            if os.path.exists(destination_path):
                os.remove(destination_path)
            raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

        # Load and validate content with pandas
        try:
            df = load_csv_safely(destination_path)
        except HTTPException:
            if os.path.exists(destination_path):
                os.remove(destination_path)
            raise

        display_name = os.path.splitext(sanitized_name)[0].replace("_", " ").title()

        dataset_record = DatasetModel(
            id=dataset_id,
            name=display_name,
            filename=sanitized_name,
            file_path=destination_path,
            row_count=len(df),
            column_count=len(df.columns),
            is_sample=False
        )

        db.add(dataset_record)
        db.commit()
        db.refresh(dataset_record)
        return dataset_record

    @staticmethod
    def list_all(db: Session) -> List[DatasetModel]:
        """Return all datasets (both samples and user uploads)."""
        return db.query(DatasetModel).order_by(DatasetModel.is_sample.desc(), DatasetModel.created_at.desc()).all()

    @staticmethod
    def get_by_id(dataset_id: str, db: Session) -> DatasetModel:
        """Retrieve dataset record by ID."""
        record = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
        if not record:
            raise HTTPException(status_code=404, detail=f"Dataset with ID '{dataset_id}' not found.")
        return record
