"""
Data input routes — CSV/Excel upload, OCR image upload, NLP text entry.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import Business, User, Transaction
from schemas import ImportRequest
from routes.auth import get_current_user_dep
from services import data_import as svc_import
from services import ocr_service as svc_ocr
from services import ai_service as svc_ai
from services.data_import import STANDARD_FIELDS
import json

router = APIRouter(prefix="/businesses/{business_id}/data-input", tags=["data-input"])


def _check_biz(business_id: int, user: User, db: Session) -> Business:
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user.id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return biz


# ── CSV / Excel Upload ──

@router.post("/upload-csv")
async def upload_csv(
    business_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)

    allowed = (".csv", ".xlsx", ".xls")
    filename = file.filename or ""
    if not any(filename.lower().endswith(ext) for ext in allowed):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Please upload {', '.join(allowed)} files.",
        )

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    result = svc_import.load_file(content, filename)
    if result.get("error"):
        raise HTTPException(status_code=422, detail=result["error"])

    # Suggest column mappings
    suggested = svc_ai.suggest_column_mappings(result["columns"], STANDARD_FIELDS)

    return {
        "session_id": result["session_id"],
        "columns": result["columns"],
        "preview": result["preview"],
        "row_count": result["row_count"],
        "suggested_mappings": suggested,
        "standard_fields": STANDARD_FIELDS,
    }


@router.post("/validate-csv")
async def validate_csv(
    business_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    session_id = body.get("session_id")
    mappings = body.get("mappings", [])
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    return svc_import.validate_preview(session_id, mappings)


@router.post("/import-csv")
async def import_csv(
    business_id: int,
    body: ImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    mappings = [m.model_dump() for m in body.mappings]
    result = svc_import.import_with_mappings(body.session_id, business_id, mappings, db)
    if result.get("error"):
        raise HTTPException(status_code=422, detail=result["error"])
    return result


# ── Image / OCR Upload ──

@router.post("/upload-image")
async def upload_image(
    business_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)

    filename = file.filename or ""
    allowed_img = (".jpg", ".jpeg", ".png")
    if not any(filename.lower().endswith(ext) for ext in allowed_img):
        raise HTTPException(
            status_code=400,
            detail="Unsupported image type. Use JPG, JPEG, or PNG.",
        )

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 5 MB)")

    ocr_result = svc_ocr.extract_text_from_bytes(content, filename)
    if not ocr_result["success"]:
        return {
            "success": False,
            "extracted_text": "",
            "structured_data": None,
            "error": ocr_result["error"],
        }

    extracted_text = ocr_result["text"]
    structured = svc_ai.extract_transaction_from_text(extracted_text)

    return {
        "success": True,
        "extracted_text": extracted_text,
        "structured_data": structured,
        "error": None,
    }


@router.post("/confirm-ocr")
async def confirm_ocr(
    business_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    """Save confirmed OCR-extracted transaction to the database."""
    _check_biz(business_id, current_user, db)
    data = body.get("transaction", {})

    if not data:
        raise HTTPException(status_code=400, detail="No transaction data provided")

    from datetime import date as dt_date
    from services.data_import import _parse_date, _safe_float

    t_type = str(data.get("transaction_type") or "sale").lower()
    if t_type not in ("sale", "purchase"):
        t_type = "sale"

    total = _safe_float(data.get("amount")) or _safe_float(data.get("total_amount"))
    if total is None:
        raise HTTPException(status_code=400, detail="Amount is required")

    t = Transaction(
        business_id=business_id,
        date=_parse_date(data.get("date")) or dt_date.today(),
        type=t_type,
        quantity=_safe_float(data.get("quantity")),
        unit_price=_safe_float(data.get("unit_price")),
        total_amount=total,
        product_name=data.get("product"),
        category=data.get("category"),
        description=data.get("description"),
        source="ocr",
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return {"message": "Transaction saved", "id": t.id}


# ── Natural Language Entry ──

@router.post("/nlp-extract")
async def nlp_extract(
    business_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    text = body.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    result = svc_ai.extract_transaction_from_text(text)
    return {"extracted": result, "original_text": text}


@router.post("/confirm-nlp")
async def confirm_nlp(
    business_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    """Save confirmed NLP-extracted transaction."""
    _check_biz(business_id, current_user, db)
    # Reuse the same confirm logic as OCR
    from routes.data_input import confirm_ocr
    return await confirm_ocr(business_id, body, db, current_user)
