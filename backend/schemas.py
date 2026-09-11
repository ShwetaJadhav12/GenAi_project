from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import date, datetime


# ─────────────────── User ───────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────── Business ───────────────────

class BusinessCreate(BaseModel):
    business_name: str
    business_type: str
    currency: str = "INR"
    location: Optional[str] = None


class BusinessOut(BaseModel):
    id: int
    user_id: int
    business_name: str
    business_type: str
    currency: str
    location: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────── Product ───────────────────

class ProductCreate(BaseModel):
    name: str
    category: Optional[str] = None
    unit: Optional[str] = None
    selling_price: Optional[float] = None
    cost_price: Optional[float] = None
    current_stock: float = 0.0
    reorder_level: float = 0.0
    size: Optional[str] = None
    color: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    selling_price: Optional[float] = None
    cost_price: Optional[float] = None
    current_stock: Optional[float] = None
    reorder_level: Optional[float] = None
    size: Optional[str] = None
    color: Optional[str] = None


class ProductOut(BaseModel):
    id: int
    business_id: int
    name: str
    category: Optional[str]
    unit: Optional[str]
    selling_price: Optional[float]
    cost_price: Optional[float]
    current_stock: float
    reorder_level: float
    size: Optional[str]
    color: Optional[str]

    class Config:
        from_attributes = True


# ─────────────────── Transaction ───────────────────

class TransactionCreate(BaseModel):
    date: date
    type: str                       # sale | purchase
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    total_amount: float
    description: Optional[str] = None
    product_name: Optional[str] = None
    category: Optional[str] = None
    product_id: Optional[int] = None
    source: str = "manual"

    @field_validator("type")
    @classmethod
    def validate_type(cls, v):
        if v not in ("sale", "purchase"):
            raise ValueError("type must be 'sale' or 'purchase'")
        return v


class TransactionOut(BaseModel):
    id: int
    business_id: int
    product_id: Optional[int]
    date: date
    type: str
    quantity: Optional[float]
    unit_price: Optional[float]
    total_amount: float
    description: Optional[str]
    product_name: Optional[str]
    category: Optional[str]
    source: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────── Expense ───────────────────

class ExpenseCreate(BaseModel):
    date: date
    category: str
    description: Optional[str] = None
    amount: float


class ExpenseOut(BaseModel):
    id: int
    business_id: int
    date: date
    category: str
    description: Optional[str]
    amount: float
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────── Analytics ───────────────────

class AnalyticsSummary(BaseModel):
    total_revenue: float
    total_expenses: float
    estimated_profit: float
    profit_is_estimate: bool
    num_transactions: int
    avg_transaction_value: float
    sales_growth_pct: Optional[float]
    expense_growth_pct: Optional[float]
    period_label: str


class TopProduct(BaseModel):
    product_name: str
    total_quantity: float
    total_revenue: float


class LowStockProduct(BaseModel):
    id: int
    name: str
    current_stock: float
    reorder_level: float


# ─────────────────── Forecast ───────────────────

class ForecastResult(BaseModel):
    has_forecast: bool
    message: str
    historical: List[dict] = []
    forecast: List[dict] = []
    mae: Optional[float] = None
    rmse: Optional[float] = None


# ─────────────────── AI ───────────────────

class AIInsightRequest(BaseModel):
    business_id: int
    period_days: int = 30


class AIInsightResponse(BaseModel):
    summary: str
    key_problems: List[str]
    recommendations: List[str]
    action_plan: List[dict]


class ChatMessage(BaseModel):
    business_id: int
    message: str


class ChatResponse(BaseModel):
    reply: str
    data_used: Optional[dict] = None


# ─────────────────── What-If ───────────────────

class WhatIfRequest(BaseModel):
    business_id: int
    scenario_type: str          # price_change | expense_change
    product_id: Optional[int] = None
    current_value: float
    new_value: float
    period_days: int = 30


class WhatIfResponse(BaseModel):
    scenario_description: str
    estimated_current: float
    estimated_new: float
    estimated_change: float
    estimated_change_pct: float
    ai_explanation: str


# ─────────────────── OCR / NLP ───────────────────

class ExtractedTransaction(BaseModel):
    transaction_type: Optional[str] = None
    product: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    description: Optional[str] = None
    confidence: str = "low"       # low | medium | high


class NLPExtractRequest(BaseModel):
    text: str
    business_id: int


# ─────────────────── CSV Import ───────────────────

class ColumnMapping(BaseModel):
    source_column: str
    target_field: str


class ImportRequest(BaseModel):
    business_id: int
    mappings: List[ColumnMapping]
    session_id: str               # ties back to the uploaded preview
