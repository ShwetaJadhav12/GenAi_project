"""
Data Import Service — handles CSV/Excel file parsing, preview, column mapping, and DB import.
"""
import os
import uuid
import logging
from datetime import date
from typing import List, Dict, Optional
from pathlib import Path

import pandas as pd
import numpy as np
from io import BytesIO

logger = logging.getLogger(__name__)

# Temp storage for upload sessions (in-memory; fine for a single-server capstone)
_upload_sessions: Dict[str, pd.DataFrame] = {}

STANDARD_FIELDS = [
    "date", "product", "category", "quantity",
    "unit_price", "total_amount", "transaction_type", "expense_category",
    "description",
]

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ─────────────────── load file ───────────────────

def load_file(file_bytes: bytes, filename: str) -> dict:
    """
    Parse CSV or Excel file.
    Returns {"session_id", "columns", "preview", "row_count", "error"}
    """
    suffix = Path(filename).suffix.lower()
    try:
        if suffix == ".csv":
            # pandas 3.x removed the 'errors' kwarg; use encoding_errors instead
            try:
                df = pd.read_csv(BytesIO(file_bytes), encoding="utf-8", encoding_errors="replace")
            except TypeError:
                # fallback for older pandas versions that don't have encoding_errors
                df = pd.read_csv(BytesIO(file_bytes), encoding="utf-8")
        elif suffix in (".xlsx", ".xls"):
            df = pd.read_excel(BytesIO(file_bytes))
        else:
            return {"error": f"Unsupported file type '{suffix}'. Use .csv, .xlsx, or .xls."}
    except Exception as e:
        return {"error": f"Could not read file: {str(e)}"}

    if df.empty:
        return {"error": "The uploaded file is empty."}

    # Clean column names
    df.columns = [str(c).strip() for c in df.columns]

    # Store session
    session_id = str(uuid.uuid4())
    _upload_sessions[session_id] = df

    preview = df.head(5).replace({np.nan: None}).to_dict(orient="records")

    return {
        "session_id": session_id,
        "columns": list(df.columns),
        "preview": preview,
        "row_count": len(df),
        "error": None,
    }


# ─────────────────── import with mappings ───────────────────

def import_with_mappings(
    session_id: str,
    business_id: int,
    mappings: List[Dict],   # [{"source_column": ..., "target_field": ...}]
    db,
) -> dict:
    """
    Apply column mappings and bulk-insert records into the DB.
    Returns {"imported": int, "skipped": int, "errors": list}
    """
    from models import Transaction, Expense, Product

    df = _upload_sessions.get(session_id)
    if df is None:
        return {"error": "Upload session expired. Please upload the file again."}

    # Build mapping dict
    col_map = {m["source_column"]: m["target_field"] for m in mappings if m["target_field"]}

    # Rename columns
    df_mapped = df.rename(columns=col_map)

    imported = 0
    skipped = 0
    errors = []

    for idx, row in df_mapped.iterrows():
        try:
            row_dict = {k: (None if pd.isna(v) else v) for k, v in row.items()}
            record = _build_record(row_dict, business_id)
            if record is None:
                skipped += 1
                continue
            if isinstance(record, Transaction):
                db.add(record)
                imported += 1
            elif isinstance(record, Expense):
                db.add(record)
                imported += 1
        except Exception as e:
            skipped += 1
            errors.append(f"Row {idx + 2}: {str(e)}")

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        return {"error": f"Database commit failed: {str(e)}", "imported": 0, "skipped": skipped, "errors": errors}

    # Clean up session
    _upload_sessions.pop(session_id, None)

    return {
        "imported": imported,
        "skipped": skipped,
        "errors": errors[:20],  # cap error list
        "error": None,
    }


def _parse_date(val) -> Optional[date]:
    if val is None:
        return date.today()
    if isinstance(val, date):
        return val
    try:
        return pd.to_datetime(str(val)).date()
    except Exception:
        return date.today()


def _safe_float(val) -> Optional[float]:
    if val is None:
        return None
    try:
        return float(str(val).replace(",", "").replace("₹", "").replace("$", "").strip())
    except (ValueError, TypeError):
        return None


def _build_record(row: dict, business_id: int):
    """Convert a mapped row dict to a Transaction or Expense ORM object."""
    from models import Transaction, Expense

    t_type_raw = str(row.get("transaction_type") or "sale").lower().strip()
    exp_cat = row.get("expense_category")

    # If expense category is present, treat as an expense record
    if exp_cat and exp_cat not in ("", "nan", "None"):
        amount = _safe_float(row.get("total_amount") or row.get("amount"))
        if amount is None or amount <= 0:
            return None
        return Expense(
            business_id=business_id,
            date=_parse_date(row.get("date")),
            category=str(exp_cat),
            description=str(row.get("description") or ""),
            amount=amount,
        )

    # Otherwise treat as a transaction
    t_type = "sale" if "sale" in t_type_raw else ("purchase" if "purchase" in t_type_raw else "sale")
    total = _safe_float(row.get("total_amount"))
    qty = _safe_float(row.get("quantity"))
    price = _safe_float(row.get("unit_price"))

    # Auto-calculate missing total
    if total is None and qty is not None and price is not None:
        total = qty * price
    if total is None or total < 0:
        return None

    return Transaction(
        business_id=business_id,
        date=_parse_date(row.get("date")),
        type=t_type,
        quantity=qty,
        unit_price=price,
        total_amount=total,
        product_name=str(row.get("product") or "") or None,
        category=str(row.get("category") or "") or None,
        description=str(row.get("description") or "") or None,
        source="csv",
    )


# ─────────────────── validate data ───────────────────

def validate_preview(session_id: str, mappings: List[Dict]) -> dict:
    """Validate data without importing. Returns summary of issues."""
    df = _upload_sessions.get(session_id)
    if df is None:
        return {"error": "Session expired."}

    col_map = {m["source_column"]: m["target_field"] for m in mappings if m["target_field"]}
    df_mapped = df.rename(columns=col_map)

    issues = []
    valid = 0
    for idx, row in df_mapped.iterrows():
        row_dict = {k: (None if pd.isna(v) else v) for k, v in row.items()}
        total = _safe_float(row_dict.get("total_amount"))
        qty = _safe_float(row_dict.get("quantity"))
        price = _safe_float(row_dict.get("unit_price"))
        if total is None and (qty is None or price is None):
            issues.append(f"Row {idx + 2}: cannot determine amount (total_amount or quantity+unit_price required)")
        else:
            valid += 1

    return {"valid_rows": valid, "issues": issues[:20]}
