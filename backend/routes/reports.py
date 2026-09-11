"""
Reports route — generate a structured business report.
PDF export handled client-side (html2pdf / print) to avoid heavy server deps.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Business, User
from routes.auth import get_current_user_dep
from services import analytics as svc_analytics
from services import ai_service as svc_ai
from services.forecast import build_forecast

router = APIRouter(prefix="/businesses/{business_id}/reports", tags=["reports"])


@router.get("/full")
def full_report(
    business_id: int,
    period_days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == current_user.id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    summary = svc_analytics.get_summary(db, business_id, period_days)
    top_products = svc_analytics.get_top_products(db, business_id, period_days)
    low_stock = svc_analytics.get_low_stock(db, business_id)
    sales_cat = svc_analytics.get_sales_by_category(db, business_id, period_days)
    exp_cat = svc_analytics.get_expense_by_category(db, business_id, period_days)
    daily_sales = svc_analytics.get_daily_sales(db, business_id, 90)

    forecast_result = build_forecast(daily_sales)

    context = {
        "summary": summary,
        "top_products": top_products,
        "low_stock_products": low_stock,
        "slow_moving_products": svc_analytics.get_slow_products(db, business_id, period_days),
        "sales_by_category": sales_cat,
        "expense_by_category": exp_cat,
    }
    insights = svc_ai.generate_insights(context, biz.business_name, biz.business_type)

    return {
        "business": {
            "name": biz.business_name,
            "type": biz.business_type,
            "currency": biz.currency,
            "location": biz.location,
        },
        "period": {
            "days": period_days,
            "start": summary["period_start"],
            "end": summary["period_end"],
        },
        "summary": summary,
        "top_products": top_products,
        "low_stock": low_stock,
        "sales_by_category": sales_cat,
        "expense_by_category": exp_cat,
        "forecast": forecast_result,
        "ai_insights": insights,
    }
