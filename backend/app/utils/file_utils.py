"""
File utilities for safe file handling, path traversal prevention, and dataset storage.
"""
import os
import re
import uuid
from typing import Tuple
import pandas as pd
from fastapi import HTTPException

# Directory constants
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
UPLOAD_DIR = os.path.abspath(os.path.join(BASE_DIR, "datasets", "uploads"))
SAMPLE_DIR = os.path.abspath(os.path.join(BASE_DIR, "datasets", "sample"))

# 25 MB default limit
MAX_UPLOAD_SIZE_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_MB", "25")) * 1024 * 1024

def ensure_directories() -> None:
    """Ensure upload and sample directories exist."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(SAMPLE_DIR, exist_ok=True)

def generate_dataset_id() -> str:
    """Generate a clean unique dataset identifier."""
    return f"ds_{uuid.uuid4().hex[:12]}"

def generate_experiment_id() -> str:
    """Generate a clean unique experiment identifier."""
    return f"exp_{uuid.uuid4().hex[:12]}"

def sanitize_filename(filename: str) -> str:
    """
    Sanitize uploaded filename to prevent directory traversal or malformed paths.
    """
    clean_name = os.path.basename(filename)
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean_name)
    if not clean_name.lower().endswith(".csv"):
        clean_name += ".csv"
    return clean_name

def is_safe_path(target_path: str, allowed_dirs: Tuple[str, ...]) -> bool:
    """
    Verify that target_path resolves strictly within one of the allowed directories.
    Prevents path traversal attacks (e.g., ../../../etc/passwd).
    """
    resolved_path = os.path.abspath(target_path)
    for allowed in allowed_dirs:
        allowed_resolved = os.path.abspath(allowed)
        if os.path.commonpath([resolved_path, allowed_resolved]) == allowed_resolved:
            return True
    return False

def get_safe_dataset_path(file_path: str) -> str:
    """
    Validate that the dataset path is safe to access.
    """
    ensure_directories()
    if not is_safe_path(file_path, (UPLOAD_DIR, SAMPLE_DIR)):
        raise HTTPException(status_code=403, detail="Access to specified file path is forbidden.")
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Dataset file not found on server disk.")
    return file_path

def load_csv_safely(file_path: str) -> pd.DataFrame:
    """
    Load a CSV file with robust error handling and encoding fallbacks.
    """
    safe_path = get_safe_dataset_path(file_path)
    try:
        # Try UTF-8 first
        df = pd.read_csv(safe_path)
    except UnicodeDecodeError:
        try:
            # Fallback to Latin-1
            df = pd.read_csv(safe_path, encoding="latin-1")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse CSV file with encoding fallback: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted CSV file: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="The CSV file is empty.")
    if len(df.columns) < 2:
        raise HTTPException(status_code=400, detail="Dataset must contain at least 2 columns (features and a target).")
    if len(df) < 5:
        raise HTTPException(status_code=400, detail="Dataset must contain at least 5 rows for meaningful analysis.")

    return df
