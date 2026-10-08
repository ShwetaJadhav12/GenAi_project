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


# ─────────────────── Digital Marketing Campaign Planner ───────────────────

class CampaignPlannerRequest(BaseModel):
    business_id: int
    campaign_objective: str = "increase_sales"  # increase_sales | brand_awareness | lead_generation | product_launch | clearance_inventory
    duration_days: int = 14                     # 7 | 14 | 21 | 30
    total_budget: float = 10000.0               # within currency
    target_location: Optional[str] = None
    target_audience_notes: Optional[str] = None
    preferred_platforms: Optional[List[str]] = None  # instagram, facebook, whatsapp, youtube, google_ads, email
    posting_capacity: Optional[str] = "moderate"     # low | moderate | high
    selected_product_ids: Optional[List[int]] = None
    discount_offer_text: Optional[str] = None
    additional_goals: Optional[str] = None


# ─────────────────── Social Media Content Generator ───────────────────

class SocialContentRequest(BaseModel):
    business_id: int
    platform: str = "all"                   # instagram | facebook | whatsapp | linkedin | all
    content_type: str = "promotional_offer" # promotional_offer | product_spotlight | new_arrival | ad_copy | festival_sale | tips_value
    target_audience: Optional[str] = None   # e.g., "Local families & working professionals"
    marketing_goal: Optional[str] = None    # e.g., "Boost weekend sales & footfall"
    product_or_topic: Optional[str] = None  # e.g., "Fresh Organic Apples / Weekend Special"
    tone: Optional[str] = "Engaging & Friendly" # Engaging & Friendly | Professional | High-Energy | Witty
    offer_details: Optional[str] = None     # e.g., "Flat 20% off above ₹500"
    additional_notes: Optional[str] = None


# ─────────────────── AI Creative Studio (Images & Videos) ───────────────────

class ImageGenerationRequest(BaseModel):
    business_id: int
    prompt: str
    product_name: Optional[str] = None
    style: str = "photorealistic"          # photorealistic | minimalist_studio | luxury_editorial | vibrant_pop | festive_flyer | 3d_render
    aspect_ratio: str = "1:1"              # 1:1 | 9:16 | 16:9 | 4:5
    color_theme: Optional[str] = None      # e.g., "Warm Sunset", "Neon Electric", "Clean Minimalist Emerald"
    text_headline: Optional[str] = None    # e.g., "Summer Mega Sale"
    discount_tag: Optional[str] = None     # e.g., "Up to 30% OFF"


class VideoGenerationRequest(BaseModel):
    business_id: int
    prompt: str
    product_name: Optional[str] = None
    video_type: str = "product_reel"       # product_reel | promo_discount | story_ad | viral_hook | customer_testimonial
    aspect_ratio: str = "9:16"             # 9:16 | 16:9 | 1:1
    duration_seconds: int = 15             # 15 | 30 | 60
    target_platform: str = "instagram_reels" # instagram_reels | tiktok | youtube_shorts | facebook_video
    tone: Optional[str] = "High-Energy & Trendy"


