"""
Analytics routes — dashboard KPIs, charts, trends.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Business, User
from routes.auth import get_current_user_dep
from services import analytics as svc
from fastapi import HTTPException

router = APIRouter(prefix="/businesses/{business_id}/analytics", tags=["analytics"])


def _check_biz(business_id: int, user: User, db: Session) -> Business:
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user.id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return biz


@router.get("/summary")
def get_summary(
    business_id: int,
    period_days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    return svc.get_summary(db, business_id, period_days)


@router.get("/top-products")
def top_products(
    business_id: int,
    period_days: int = Query(30, ge=7, le=365),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    return svc.get_top_products(db, business_id, period_days, limit)


@router.get("/low-stock")
def low_stock(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    return svc.get_low_stock(db, business_id)


@router.get("/slow-products")
def slow_products(
    business_id: int,
    period_days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    return svc.get_slow_products(db, business_id, period_days)


@router.get("/daily-sales")
def daily_sales(
    business_id: int,
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    return svc.get_daily_sales(db, business_id, days)


@router.get("/daily-expenses")
def daily_expenses(
    business_id: int,
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    return svc.get_daily_expenses(db, business_id, days)


@router.get("/sales-by-category")
def sales_by_category(
    business_id: int,
    period_days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    return svc.get_sales_by_category(db, business_id, period_days)


@router.get("/expense-by-category")
def expense_by_category(
    business_id: int,
    period_days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    return svc.get_expense_by_category(db, business_id, period_days)


@router.get("/dashboard")
def full_dashboard(
    business_id: int,
    period_days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    """Single endpoint that returns everything the dashboard needs."""
    _check_biz(business_id, current_user, db)
    return {
        "summary": svc.get_summary(db, business_id, period_days),
        "top_products": svc.get_top_products(db, business_id, period_days),
        "low_stock": svc.get_low_stock(db, business_id),
        "daily_sales": svc.get_daily_sales(db, business_id, 90),
        "daily_expenses": svc.get_daily_expenses(db, business_id, 90),
        "sales_by_category": svc.get_sales_by_category(db, business_id, period_days),
        "expense_by_category": svc.get_expense_by_category(db, business_id, period_days),
    }
