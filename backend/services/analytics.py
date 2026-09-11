"""
Analytics Engine — all numerical metrics are computed here.
The LLM receives the output of this module, never raw queries.
"""
from datetime import date, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import Transaction, Expense, Product


# ─────────────────── helpers ───────────────────

def _period_bounds(period_days: int):
    today = date.today()
    current_end = today
    current_start = today - timedelta(days=period_days)
    prev_end = current_start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=period_days)
    return current_start, current_end, prev_start, prev_end


def _safe_growth(current: float, previous: float) -> Optional[float]:
    if previous == 0:
        return None
    return round((current - previous) / previous * 100, 2)


# ─────────────────── core summary ───────────────────

def get_summary(db: Session, business_id: int, period_days: int = 30) -> dict:
    curr_start, curr_end, prev_start, prev_end = _period_bounds(period_days)

    # Revenue — sum of sales in current period
    curr_sales_rows = (
        db.query(func.sum(Transaction.total_amount))
        .filter(
            Transaction.business_id == business_id,
            Transaction.type == "sale",
            Transaction.date >= curr_start,
            Transaction.date <= curr_end,
        )
        .scalar()
    ) or 0.0

    prev_sales_rows = (
        db.query(func.sum(Transaction.total_amount))
        .filter(
            Transaction.business_id == business_id,
            Transaction.type == "sale",
            Transaction.date >= prev_start,
            Transaction.date <= prev_end,
        )
        .scalar()
    ) or 0.0

    # Expenses
    curr_expenses = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.business_id == business_id,
            Expense.date >= curr_start,
            Expense.date <= curr_end,
        )
        .scalar()
    ) or 0.0

    prev_expenses = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.business_id == business_id,
            Expense.date >= prev_start,
            Expense.date <= prev_end,
        )
        .scalar()
    ) or 0.0

    # Transaction count and average
    num_sales = (
        db.query(func.count(Transaction.id))
        .filter(
            Transaction.business_id == business_id,
            Transaction.type == "sale",
            Transaction.date >= curr_start,
            Transaction.date <= curr_end,
        )
        .scalar()
    ) or 0

    avg_transaction = curr_sales_rows / num_sales if num_sales > 0 else 0.0

    # Estimated COGS from purchase transactions
    cogs = (
        db.query(func.sum(Transaction.total_amount))
        .filter(
            Transaction.business_id == business_id,
            Transaction.type == "purchase",
            Transaction.date >= curr_start,
            Transaction.date <= curr_end,
        )
        .scalar()
    ) or 0.0

    # Profit
    has_cost_data = cogs > 0
    estimated_profit = curr_sales_rows - curr_expenses - cogs
    profit_is_estimate = not has_cost_data  # if no COGS, profit = revenue - expenses only
    if not has_cost_data:
        estimated_profit = curr_sales_rows - curr_expenses

    return {
        "total_revenue": round(curr_sales_rows, 2),
        "total_expenses": round(curr_expenses, 2),
        "estimated_cogs": round(cogs, 2),
        "estimated_profit": round(estimated_profit, 2),
        "profit_is_estimate": profit_is_estimate,
        "num_transactions": num_sales,
        "avg_transaction_value": round(avg_transaction, 2),
        "sales_growth_pct": _safe_growth(curr_sales_rows, prev_sales_rows),
        "expense_growth_pct": _safe_growth(curr_expenses, prev_expenses),
        "period_label": f"Last {period_days} days",
        "period_start": str(curr_start),
        "period_end": str(curr_end),
        "prev_revenue": round(prev_sales_rows, 2),
        "prev_expenses": round(prev_expenses, 2),
    }


# ─────────────────── top products ───────────────────

def get_top_products(db: Session, business_id: int, period_days: int = 30, limit: int = 5) -> list:
    curr_start, curr_end, _, _ = _period_bounds(period_days)
    rows = (
        db.query(
            Transaction.product_name,
            func.sum(Transaction.quantity).label("total_qty"),
            func.sum(Transaction.total_amount).label("total_rev"),
        )
        .filter(
            Transaction.business_id == business_id,
            Transaction.type == "sale",
            Transaction.date >= curr_start,
            Transaction.date <= curr_end,
            Transaction.product_name.isnot(None),
        )
        .group_by(Transaction.product_name)
        .order_by(func.sum(Transaction.total_amount).desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "product_name": r.product_name,
            "total_quantity": round(r.total_qty or 0, 2),
            "total_revenue": round(r.total_rev or 0, 2),
        }
        for r in rows
    ]


# ─────────────────── slow-moving products ───────────────────

def get_slow_products(db: Session, business_id: int, period_days: int = 30) -> list:
    curr_start, curr_end, _, _ = _period_bounds(period_days)
    all_products = db.query(Product).filter(Product.business_id == business_id).all()
    sold_names = {
        r[0]
        for r in db.query(Transaction.product_name)
        .filter(
            Transaction.business_id == business_id,
            Transaction.type == "sale",
            Transaction.date >= curr_start,
            Transaction.date <= curr_end,
        )
        .distinct()
        .all()
        if r[0]
    }
    slow = [p.name for p in all_products if p.name not in sold_names]
    return slow


# ─────────────────── low stock ───────────────────

def get_low_stock(db: Session, business_id: int) -> list:
    products = (
        db.query(Product)
        .filter(
            Product.business_id == business_id,
            Product.reorder_level > 0,
            Product.current_stock <= Product.reorder_level,
        )
        .all()
    )
    return [
        {
            "id": p.id,
            "name": p.name,
            "current_stock": p.current_stock,
            "reorder_level": p.reorder_level,
            "unit": p.unit,
        }
        for p in products
    ]


# ─────────────────── daily sales series ───────────────────

def get_daily_sales(db: Session, business_id: int, days: int = 90) -> list:
    start = date.today() - timedelta(days=days)
    rows = (
        db.query(
            Transaction.date,
            func.sum(Transaction.total_amount).label("total"),
        )
        .filter(
            Transaction.business_id == business_id,
            Transaction.type == "sale",
            Transaction.date >= start,
        )
        .group_by(Transaction.date)
        .order_by(Transaction.date)
        .all()
    )
    return [{"date": str(r.date), "amount": round(r.total, 2)} for r in rows]


# ─────────────────── daily expense series ───────────────────

def get_daily_expenses(db: Session, business_id: int, days: int = 90) -> list:
    start = date.today() - timedelta(days=days)
    rows = (
        db.query(
            Expense.date,
            func.sum(Expense.amount).label("total"),
        )
        .filter(
            Expense.business_id == business_id,
            Expense.date >= start,
        )
        .group_by(Expense.date)
        .order_by(Expense.date)
        .all()
    )
    return [{"date": str(r.date), "amount": round(r.total, 2)} for r in rows]


# ─────────────────── sales by category ───────────────────

def get_sales_by_category(db: Session, business_id: int, period_days: int = 30) -> list:
    curr_start, curr_end, _, _ = _period_bounds(period_days)
    rows = (
        db.query(
            Transaction.category,
            func.sum(Transaction.total_amount).label("total"),
        )
        .filter(
            Transaction.business_id == business_id,
            Transaction.type == "sale",
            Transaction.date >= curr_start,
            Transaction.date <= curr_end,
        )
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.total_amount).desc())
        .all()
    )
    return [
        {"category": r.category or "Uncategorized", "total": round(r.total, 2)}
        for r in rows
    ]


# ─────────────────── expense by category ───────────────────

def get_expense_by_category(db: Session, business_id: int, period_days: int = 30) -> list:
    curr_start, curr_end, _, _ = _period_bounds(period_days)
    rows = (
        db.query(
            Expense.category,
            func.sum(Expense.amount).label("total"),
        )
        .filter(
            Expense.business_id == business_id,
            Expense.date >= curr_start,
            Expense.date <= curr_end,
        )
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )
    return [{"category": r.category, "total": round(r.total, 2)} for r in rows]


# ─────────────────── full context bundle for LLM ───────────────────

def build_llm_context(db: Session, business_id: int, period_days: int = 30) -> dict:
    """Return a structured dict of verified metrics ready to pass to the LLM."""
    summary = get_summary(db, business_id, period_days)
    top_products = get_top_products(db, business_id, period_days)
    low_stock = get_low_stock(db, business_id)
    slow_products = get_slow_products(db, business_id, period_days)
    by_category = get_sales_by_category(db, business_id, period_days)
    exp_category = get_expense_by_category(db, business_id, period_days)

    return {
        "summary": summary,
        "top_products": top_products,
        "low_stock_products": low_stock,
        "slow_moving_products": slow_products,
        "sales_by_category": by_category,
        "expense_by_category": exp_category,
    }
