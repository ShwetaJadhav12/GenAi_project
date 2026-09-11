"""
AI routes — insights, chat, NLP extraction, what-if, action plan.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Business, User
from schemas import ChatMessage, WhatIfRequest
from routes.auth import get_current_user_dep
from services import analytics as svc_analytics
from services import ai_service as svc_ai

router = APIRouter(prefix="/businesses/{business_id}/ai", tags=["ai"])


def _get_biz(business_id: int, user: User, db: Session) -> Business:
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user.id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return biz


@router.get("/insights")
def get_insights(
    business_id: int,
    period_days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    biz = _get_biz(business_id, current_user, db)
    context = svc_analytics.build_llm_context(db, business_id, period_days)
    result = svc_ai.generate_insights(context, biz.business_name, biz.business_type)
    return {"insights": result, "metrics_used": context}


@router.post("/chat")
def chat(
    business_id: int,
    body: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    biz = _get_biz(business_id, current_user, db)
    context = svc_analytics.build_llm_context(db, business_id, 30)
    result = svc_ai.chat_with_data(body.message, context, biz.business_name, biz.business_type)
    return result


@router.post("/extract-text")
def extract_from_text(
    business_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _get_biz(business_id, current_user, db)
    text = body.get("text", "")
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    result = svc_ai.extract_transaction_from_text(text)
    return result


@router.post("/whatif")
def whatif(
    business_id: int,
    body: WhatIfRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    biz = _get_biz(business_id, current_user, db)
    summary = svc_analytics.get_summary(db, business_id, body.period_days)

    current_revenue = summary["total_revenue"]
    current_expenses = summary["total_expenses"]

    if body.scenario_type == "price_change":
        if body.current_value <= 0:
            raise HTTPException(status_code=400, detail="current_value must be positive")
        price_ratio = body.new_value / body.current_value
        estimated_new_revenue = current_revenue * price_ratio
        estimated_current = current_revenue
        estimated_new = estimated_new_revenue
        scenario_desc = (
            f"Changing price from {body.current_value:.2f} to {body.new_value:.2f} "
            f"({((price_ratio - 1)*100):+.1f}%) — assuming demand stays constant."
        )
    elif body.scenario_type == "expense_change":
        diff = body.new_value - body.current_value
        estimated_new = current_expenses + diff
        estimated_current = current_expenses
        scenario_desc = (
            f"Changing expense from {body.current_value:.2f} to {body.new_value:.2f} "
            f"({diff:+.2f} total impact on expenses)."
        )
    else:
        raise HTTPException(status_code=400, detail="scenario_type must be price_change or expense_change")

    change = estimated_new - estimated_current
    change_pct = (change / estimated_current * 100) if estimated_current else 0

    scenario_data = {
        "scenario_description": scenario_desc,
        "estimated_current": round(estimated_current, 2),
        "estimated_new": round(estimated_new, 2),
        "estimated_change": round(change, 2),
        "estimated_change_pct": round(change_pct, 2),
        "period_days": body.period_days,
        "business_name": biz.business_name,
    }

    ai_explanation = svc_ai.explain_whatif(scenario_data)
    scenario_data["ai_explanation"] = ai_explanation

    return scenario_data


@router.get("/action-plan")
def action_plan(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    biz = _get_biz(business_id, current_user, db)
    context = svc_analytics.build_llm_context(db, business_id, 30)
    insights = svc_ai.generate_insights(context, biz.business_name, biz.business_type)
    return {
        "action_plan": insights.get("action_plan", []),
        "generated_for": biz.business_name,
    }
