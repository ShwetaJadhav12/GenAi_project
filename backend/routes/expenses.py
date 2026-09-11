"""
Expenses routes — CRUD for business expenses.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Business, Expense, User
from schemas import ExpenseCreate, ExpenseOut
from routes.auth import get_current_user_dep

router = APIRouter(prefix="/businesses/{business_id}/expenses", tags=["expenses"])


def _check_biz(business_id: int, user: User, db: Session) -> Business:
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user.id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return biz


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    business_id: int,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    return (
        db.query(Expense)
        .filter(Expense.business_id == business_id)
        .order_by(Expense.date.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.post("", response_model=ExpenseOut)
def create_expense(
    business_id: int,
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    e = Expense(business_id=business_id, **data.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


@router.get("/{expense_id}", response_model=ExpenseOut)
def get_expense(
    business_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    e = db.query(Expense).filter(Expense.id == expense_id, Expense.business_id == business_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Expense not found")
    return e


@router.put("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    business_id: int,
    expense_id: int,
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    e = db.query(Expense).filter(Expense.id == expense_id, Expense.business_id == business_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Expense not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(e, k, v)
    db.commit()
    db.refresh(e)
    return e


@router.delete("/{expense_id}")
def delete_expense(
    business_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    e = db.query(Expense).filter(Expense.id == expense_id, Expense.business_id == business_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(e)
    db.commit()
    return {"message": "Expense deleted"}
