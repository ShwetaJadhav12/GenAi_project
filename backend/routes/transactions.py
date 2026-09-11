"""
Transactions routes — CRUD for sales and purchase transactions.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Business, Transaction, User
from schemas import TransactionCreate, TransactionOut
from routes.auth import get_current_user_dep

router = APIRouter(prefix="/businesses/{business_id}/transactions", tags=["transactions"])


def _check_biz(business_id: int, user: User, db: Session) -> Business:
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user.id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return biz


@router.get("", response_model=list[TransactionOut])
def list_transactions(
    business_id: int,
    type: Optional[str] = Query(None, description="Filter by type: sale | purchase"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    q = db.query(Transaction).filter(Transaction.business_id == business_id)
    if type:
        q = q.filter(Transaction.type == type)
    return q.order_by(Transaction.date.desc(), Transaction.id.desc()).offset(offset).limit(limit).all()


@router.post("", response_model=TransactionOut)
def create_transaction(
    business_id: int,
    data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    t = Transaction(business_id=business_id, **data.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/{transaction_id}", response_model=TransactionOut)
def get_transaction(
    business_id: int,
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    t = db.query(Transaction).filter(
        Transaction.id == transaction_id, Transaction.business_id == business_id
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return t


@router.put("/{transaction_id}", response_model=TransactionOut)
def update_transaction(
    business_id: int,
    transaction_id: int,
    data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    t = db.query(Transaction).filter(
        Transaction.id == transaction_id, Transaction.business_id == business_id
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{transaction_id}")
def delete_transaction(
    business_id: int,
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    t = db.query(Transaction).filter(
        Transaction.id == transaction_id, Transaction.business_id == business_id
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(t)
    db.commit()
    return {"message": "Transaction deleted"}
