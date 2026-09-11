"""
Forecast routes — sales forecasting using ML.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Business, User
from routes.auth import get_current_user_dep
from services import analytics as svc_analytics
from services.forecast import build_forecast

router = APIRouter(prefix="/businesses/{business_id}/forecast", tags=["forecast"])


@router.get("")
def get_forecast(
    business_id: int,
    days: int = Query(90, ge=14, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == current_user.id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    daily_sales = svc_analytics.get_daily_sales(db, business_id, days)
    result = build_forecast(daily_sales)
    return result
