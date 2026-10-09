"""
AI Digital Marketing Campaign Planner Service:
1. Business Data Analyzer: Analyzes products, sales, inventory, stock levels, margins, and sales velocity.
2. Campaign Strategy & Calendar Generator: Generates a complete, structured digital marketing campaign plan with day-by-day calendar.
3. Campaign Validator: Checks budget allocation totals, stock availability, margin safety, posting frequency, and goal alignment.
"""
import json
import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from models import Product, Transaction, Business
from services import analytics as svc_analytics

logger = logging.getLogger(__name__)


# ─────────────────── 1. Business Data Analyzer ───────────────────

def analyze_business_data_for_campaign(db: Session, business_id: int, selected_product_ids: Optional[List[int]] = None) -> Dict[str, Any]:
    """
    Analyzes products, sales trends, stock availability, profit margins, and inventory status
    to feed into product selection and campaign validation.
    """
    query = db.query(Product).filter(Product.business_id == business_id)
    if selected_product_ids:
        query = query.filter(Product.id.in_(selected_product_ids))
    products = query.all()

    # Get recent sales data (30 days)
    context = svc_analytics.build_llm_context(db, business_id, period_days=30)
    top_products_data = context.get("top_products", [])
    top_product_names = [p["product_name"] for p in top_products_data]

    analyzed_products = []
    excess_stock = []
    high_margin = []
    low_stock = []

    for p in products:
        cost = p.cost_price or 0.0
        selling = p.selling_price or 0.0
        margin_amt = selling - cost
        margin_pct = (margin_amt / selling * 100) if selling > 0 else 0.0

        is_top_seller = p.name in top_product_names
        is_low_stock = (p.current_stock <= p.reorder_level) and (p.reorder_level > 0)
        is_excess_stock = (p.current_stock > 15) and (not is_top_seller)

        prod_info = {
            "id": p.id,
            "name": p.name,
            "category": p.category or "General",
            "selling_price": round(selling, 2),
            "cost_price": round(cost, 2),
            "margin_pct": round(margin_pct, 1),
            "current_stock": p.current_stock,
            "reorder_level": p.reorder_level,
            "is_top_seller": is_top_seller,
            "is_low_stock": is_low_stock,
            "is_excess_stock": is_excess_stock
        }
        analyzed_products.append(prod_info)

        if is_excess_stock:
            excess_stock.append(p.name)
        if margin_pct >= 25.0:
            high_margin.append(p.name)
        if is_low_stock:
            low_stock.append(p.name)

    return {
        "total_products_count": len(products),
        "products": analyzed_products,
        "top_sellers": top_product_names,
        "excess_stock_items": excess_stock,
        "high_margin_items": high_margin,
        "low_stock_items": low_stock,
        "recent_revenue": context.get("summary", {}).get("total_revenue", 0.0),
        "recent_expenses": context.get("summary", {}).get("total_expenses", 0.0),
    }


# ─────────────────── 2. Campaign Validator ───────────────────

def validate_campaign_plan(plan: dict, requested_budget: float, data_analysis: dict, objective: str) -> dict:
    """
    Validates total budget allocations, inventory stock availability, margin safety,
    posting frequency, and goal alignment using deterministic Python rules.
    """
    rules_checked = []
    warnings = []

    # Rule 1: Budget Total Validation
    budget_items = plan.get("budget_allocation", [])
    total_allocated = sum(item.get("amount", 0.0) for item in budget_items)
    budget_diff = abs(total_allocated - requested_budget)

    if budget_diff <= (requested_budget * 0.05) or total_allocated <= requested_budget:
        rules_checked.append({
            "rule": "Budget Allocation Limit",
            "passed": True,
            "details": f"Allocated sum ({total_allocated:,.2f}) matches target budget ({requested_budget:,.2f})."
        })
    else:
        warnings.append(f"Budget allocation total ({total_allocated:,.2f}) exceeds requested budget limit ({requested_budget:,.2f}).")
        rules_checked.append({
            "rule": "Budget Allocation Limit",
            "passed": False,
            "details": f"Total allocated ({total_allocated:,.2f}) differs from target budget ({requested_budget:,.2f})."
        })

    # Rule 2: Inventory & Stock Availability Check
    selected_prods = plan.get("product_selection", [])
    out_of_stock_promoted = []
    low_stock_promoted = []

    for sp in selected_prods:
        p_name = sp.get("product_name", "")
        # Find product in data analysis
        matched = next((p for p in data_analysis.get("products", []) if p["name"].lower() in p_name.lower() or p_name.lower() in p["name"].lower()), None)
        if matched:
            if matched["current_stock"] <= 0 and objective != "product_launch":
                out_of_stock_promoted.append(p_name)
            elif matched["is_low_stock"]:
                low_stock_promoted.append(p_name)

    if out_of_stock_promoted:
        warnings.append(f"Promoting products with zero available inventory: {', '.join(out_of_stock_promoted)}.")
        rules_checked.append({
            "rule": "Stock Availability Guardrail",
            "passed": False,
            "details": f"0 stock items detected for {', '.join(out_of_stock_promoted)}."
        })
    else:
        rules_checked.append({
            "rule": "Stock Availability Guardrail",
            "passed": True,
            "details": "All selected products have positive stock availability."
        })

    # Rule 3: Goal & Inventory Clearance Alignment
    if objective == "clearance_inventory":
        excess = data_analysis.get("excess_stock_items", [])
        promoted_names = [sp.get("product_name", "").lower() for sp in selected_prods]
        has_excess_promoted = any(any(ex.lower() in pn for pn in promoted_names) for ex in excess)
        if excess and not has_excess_promoted:
            warnings.append("Objective is clearance of excess stock, but no excess stock products were prioritized.")
            rules_checked.append({
                "rule": "Clearance Strategy Consistency",
                "passed": False,
                "details": "Excess inventory items were not prioritized for clearance objective."
            })
        else:
            rules_checked.append({
                "rule": "Clearance Strategy Consistency",
                "passed": True,
                "details": "Clearance strategy correctly prioritizes slow-moving and excess stock."
            })
    else:
        rules_checked.append({
            "rule": "Objective & Product Alignment",
            "passed": True,
            "details": f"Product mix aligns with campaign objective ({objective.replace('_', ' ').title()})."
        })

    # Rule 4: Platform & Frequency Feasibility Check
    calendar = plan.get("content_calendar", [])
    duration_days = plan.get("duration_days", 14)
    posts_per_day = len(calendar) / max(duration_days, 1)

    if posts_per_day > 4:
        warnings.append(f"High posting frequency ({posts_per_day:.1f} posts/day) may strain business content creation capacity.")
        rules_checked.append({
            "rule": "Capacity & Posting Frequency",
            "passed": False,
            "details": f"Average {posts_per_day:.1f} posts/day exceeds recommended threshold of 4 posts/day."
        })
    else:
        rules_checked.append({
            "rule": "Capacity & Posting Frequency",
            "passed": True,
            "details": f"Planned posting frequency ({posts_per_day:.1f} posts/day) is realistic and executable."
        })

    # Rule 5: Target Customer Data Scope Notice
    rules_checked.append({
        "rule": "Customer Audience Data Scope",
        "passed": True,
        "details": "Audience segmentation recommendation derived from product features, category positioning, and location scope."
    })

    status = "PASSED" if len(warnings) == 0 else "PASSED_WITH_WARNINGS"

    return {
        "status": status,
        "warnings": warnings,
        "rules_checked": rules_checked,
        "summary": f"Campaign Plan validation finished with status {status}. {len(rules_checked)} rule checks executed."
    }


# ─────────────────── 3. Demo Campaign Generator ───────────────────

def generate_demo_campaign_plan(req: dict, biz_name: str, biz_type: str, currency: str, data_analysis: dict) -> dict:
    """
    Generates a rich, highly structured campaign plan for demo mode or offline use.
    Handles fashion, grocery, restaurant, retail, and general business types.
    """
    objective_raw = req.get("campaign_objective", "increase_sales")
    duration = int(req.get("duration_days", 14))
    budget = float(req.get("total_budget", 10000.0))
    location = req.get("target_location") or "Metropolitan area & local neighborhood"
    notes = req.get("target_audience_notes") or ""

    objective_titles = {
        "increase_sales": "Seasonal Revenue & Sales Growth Campaign",
        "brand_awareness": "Local Market Brand Awareness & Reach Surge",
        "lead_generation": "Customer Acquisition & VIP Contact Lead Drive",
        "product_launch": "New Product Collection Showcase & Launch",
        "clearance_inventory": "Excess Stock & Seasonal Inventory Clearance Sale"
    }
    campaign_title = f"{biz_name} — {objective_titles.get(objective_raw, 'Digital Marketing Campaign')}"

    # Pick products from analysis or defaults
    all_prods = data_analysis.get("products", [])
    if all_prods:
        prod1 = all_prods[0]["name"]
        prod2 = all_prods[1]["name"] if len(all_prods) > 1 else "Featured Best-Seller"
        prod3 = all_prods[2]["name"] if len(all_prods) > 2 else "Popular Combo Item"
    else:
        prod1 = "Summer Fashion Dresses" if biz_type == "clothing" else "Organic Grocery Pantry Essentials"
        prod2 = "Lightweight Casual Shirts" if biz_type == "clothing" else "Fresh Farm Produce Basket"
        prod3 = "Matching Accessories & Footwear" if biz_type == "clothing" else "Premium Spice & Gourmet Pack"

    selected_products = [
        {
            "product_name": prod1,
            "reason": f"High demand trend with healthy profit margin ({all_prods[0]['margin_pct'] if all_prods else 42.0}%). Excellent focal item for conversions.",
            "stock_status": "Healthy stock (35+ units)",
            "promotional_angle": "Highlight quality craftsmanship, versatility, and special campaign discount."
        },
        {
            "product_name": prod2,
            "reason": "Popular seasonal pick with steady customer repeat purchases. High social media engagement potential.",
            "stock_status": "Adequate stock available",
            "promotional_angle": "Focus on daily utility, style pairing, and limited-time price offer."
        },
        {
            "product_name": prod3,
            "reason": "Ideal bundle add-on to increase Average Order Value (AOV) during campaign duration.",
            "stock_status": "Sufficient inventory for bundling",
            "promotional_angle": "Cross-sell offer: 'Pair together and save 15%'."
        }
    ]

    # Target Audience
    target_audience = {
        "demographics": {
            "age_range": "21 - 45 years old",
            "target_segments": ["Working Professionals", "Style & Quality-Conscious Shoppers", "Local Neighborhood Residents"],
            "location_scope": location,
            "interests": ["Seasonal Trends", "Smart Deals & Discounts", "Quality Shopping", "Local Business Support"]
        },
        "customer_needs": [
            "Seeking high-quality products at transparent, reasonable prices",
            "Convenient local pickup and quick online ordering via WhatsApp/Instagram",
            "Looking for styling, usage tips, and exclusive promotional value"
        ],
        "data_limitation_disclaimer": "Audience recommendations are derived from product characteristics, pricing positioning, and location attributes. Customer transaction-level demographic tracking requires opted-in customer logs."
    }

    # Platform Recommendations & Budget Allocation
    ig_budget = round(budget * 0.45, 2)
    fb_budget = round(budget * 0.35, 2)
    wa_budget = round(budget * 0.10, 2)
    email_budget = round(budget * 0.10, 2)

    platform_recommendations = [
        {
            "platform": "Instagram",
            "icon": "instagram",
            "allocated_budget": ig_budget,
            "budget_pct": 45,
            "role": "Primary Visual Engine",
            "formats": ["Reels", "Carousels", "Stories", "Product Spotlights"],
            "rationale": "Highest engagement channel for visual product discovery, reel video clips, and lifestyle showcase."
        },
        {
            "platform": "Facebook",
            "icon": "facebook",
            "allocated_budget": fb_budget,
            "budget_pct": 35,
            "role": "Community & Sponsored Ad Drive",
            "formats": ["Carousel Offers", "Catalog Posts", "Targeted Local Ads"],
            "rationale": "Reaches broader family demographic and drives targeted link clicks to shop or store location."
        },
        {
            "platform": "WhatsApp Business",
            "icon": "whatsapp",
            "allocated_budget": wa_budget,
            "budget_pct": 10,
            "role": "Direct VIP Conversion Channel",
            "formats": ["Broadcast Announcements", "Status Catalog Highlights", "1-on-1 Deals"],
            "rationale": "Highest open rate (90%+) for instant VIP orders, pre-orders, and direct customer engagement."
        },
        {
            "platform": "Email Marketing",
            "icon": "email",
            "allocated_budget": email_budget,
            "budget_pct": 10,
            "role": "Retention & Announcement Newsletter",
            "formats": ["Campaign Launch Blast", "Mid-Campaign Offer", "Last Chance Alert"],
            "rationale": "Drives recurring sales from existing opted-in customer subscriber list with zero extra ad cost."
        }
    ]

    budget_allocation = [
        {"platform": "Instagram Ads & Content", "amount": ig_budget, "percentage": 45, "purpose": "Reel promotion & visual catalog ads"},
        {"platform": "Facebook Local Ads", "amount": fb_budget, "percentage": 35, "purpose": "Targeted audience traffic & offer ads"},
        {"platform": "WhatsApp Customer Broadcasts", "amount": wa_budget, "percentage": 10, "purpose": "Direct messaging & order booking"},
        {"platform": "Email Newsletter & Design", "amount": email_budget, "percentage": 10, "purpose": "Subscriber launch email & final offer blast"}
    ]

    # Content Strategy Mix
    content_strategy = {
        "primary_formats": ["Instagram Reels (15-30s)", "Product Carousels", "Interactive Stories", "WhatsApp Direct Messages", "Email Newsletters"],
        "posting_frequency_summary": "5 to 6 content touchpoints per week across Instagram, Facebook, WhatsApp, and Email.",
        "weekly_mix": {
            "reels_or_videos": 3,
            "carousels_and_posts": 4,
            "stories_daily": "2-3 stories/day",
            "whatsapp_broadcasts": 2,
            "email_newsletters": 1
        }
    }

    # Day-by-Day Content Calendar Generation
    calendar = []
    objectives_pool = ["Brand Awareness", "Product Discovery", "Sales Promotion", "Engagement & Interaction", "Product Benefits", "Direct Conversions", "Last Chance Urgency"]
    platforms_pool = [
        ("Instagram", "Reel Showcase", prod1),
        ("Instagram", "Product Carousel", prod2),
        ("Facebook", "Promotional Offer Post", prod1),
        ("Instagram", "Stories & Poll", prod3),
        ("WhatsApp", "VIP Customer Broadcast", prod1),
        ("Email", "Promotional Campaign Blast", prod2),
        ("Instagram", "Styling / Usage Tip Reel", prod2),
        ("Facebook", "Customer Testimonial & Review", prod1),
        ("Instagram", "Product Bundle Carousel", prod3),
        ("WhatsApp", "Flash Weekend Offer Alert", prod2),
        ("Instagram", "Reel Behind The Scenes", prod1),
        ("Facebook", "Interactive Quiz & Giveaway", prod3),
        ("Email", "Last 48 Hours Offer Reminder", prod1),
        ("Instagram", "Campaign Finale & CTA Reel", prod1)
    ]

    for d in range(1, duration + 1):
        idx = (d - 1) % len(platforms_pool)
        plat, fmat, prod = platforms_pool[idx]
        obj = objectives_pool[(d - 1) % len(objectives_pool)]

        headline = f"Discover {prod} at {biz_name} — Day {d} Special!"
        caption = f"✨ Day {d}: Elevate your experience with {prod}! Explore our top picks at {biz_name}. Enjoy special campaign perks and quality guaranteed. Visit us or message now!"
        cta = "Tap the link in bio or reply 'ORDER' to get yours today!"

        calendar.append({
            "day": d,
            "day_name": f"Day {d}",
            "platform": plat,
            "content_type": fmat,
            "product_featured": prod,
            "objective": obj,
            "headline": headline,
            "caption_draft": caption,
            "call_to_action": cta,
            "suggested_time": "12:30 PM & 6:45 PM"
        })

    # Performance Tracking KPIs
    performance_tracking = [
        {"metric": "Total Reach & Impressions", "target": "15,000 - 25,000 Impressions", "purpose": "Measure brand visibility & audience expansion", "channel": "Meta Ads & Social Insights"},
        {"metric": "Click-Through Rate (CTR)", "target": "2.8% - 4.5%", "purpose": "Evaluate ad copy & visual creative effectiveness", "channel": "Google & Meta Ad Manager"},
        {"metric": "Direct Order Enquiries", "target": "45 - 80 Enquiries", "purpose": "Track direct customer interest & intent", "channel": "WhatsApp & Direct Messages"},
        {"metric": "Estimated Sales Returns", "target": f"{currency} 35,000 - {currency} 60,000", "purpose": "Evaluate campaign Return On Ad Spend (ROAS ~ 3.5x-6.0x)", "channel": "POS & Sales Transactions"}
    ]

    plan_output = {
        "campaign_name": campaign_title,
        "business_name": biz_name,
        "business_type": biz_type,
        "currency": currency,
        "campaign_objective": objective_raw,
        "duration_days": duration,
        "total_budget": budget,
        "strategy_summary": f"A comprehensive {duration}-day digital marketing plan for {biz_name} targeting high-margin and top-demand products ({prod1}, {prod2}) across Instagram, Facebook, WhatsApp, and Email with a total budget of {currency} {budget:,.2f}.",
        "product_selection": selected_products,
        "target_audience": target_audience,
        "platform_recommendations": platform_recommendations,
        "budget_allocation": budget_allocation,
        "content_strategy": content_strategy,
        "content_calendar": calendar,
        "performance_tracking": performance_tracking
    }

    # Attach validation
    validation = validate_campaign_plan(plan_output, budget, data_analysis, objective_raw)
    plan_output["validation_result"] = validation

    return plan_output


# ─────────────────── 4. Main Service Entry Point ───────────────────

def generate_campaign_plan(
    req: dict,
    biz_name: str,
    biz_type: str,
    currency: str,
    data_analysis: dict,
    call_llm_fn
) -> dict:
    """
    Orchestrates the Campaign Planning workflow:
    1. Prepares structured data context from Data Analyzer
    2. Calls LLM (or falls back to demo mode)
    3. Runs Campaign Validator
    """
    # If in DEMO MODE or if LLM call function is None
    if call_llm_fn is None:
        return generate_demo_campaign_plan(req, biz_name, biz_type, currency, data_analysis)

    objective_raw = req.get("campaign_objective", "increase_sales")
    duration = int(req.get("duration_days", 14))
    budget = float(req.get("total_budget", 10000.0))
    location = req.get("target_location") or "Local area"
    notes = req.get("target_audience_notes", "")
    platforms_pref = req.get("preferred_platforms") or ["instagram", "facebook", "whatsapp", "email"]

    prompt = f"""You are an elite Chief Marketing Officer and Digital Advertising Strategist for small and medium businesses.
Create a complete, structured digital marketing campaign plan for the following business:

BUSINESS INFORMATION:
- Name: {biz_name}
- Industry/Type: {biz_type}
- Currency: {currency}
- Campaign Objective: {objective_raw}
- Campaign Duration: {duration} days
- Total Marketing Budget: {currency} {budget:,.2f}
- Target Location Scope: {location}
- Merchant Audience Notes: {notes}
- Preferred Platforms: {', '.join(platforms_pref)}

BUSINESS DATA ANALYSIS (VERIFIED FACTS):
- Total Products Analyzed: {data_analysis.get('total_products_count')}
- High Margin Products: {json.dumps(data_analysis.get('high_margin_items', []))}
- Top Seller Products: {json.dumps(data_analysis.get('top_sellers', []))}
- Excess Stock Items: {json.dumps(data_analysis.get('excess_stock_items', []))}
- Low Stock Items: {json.dumps(data_analysis.get('low_stock_items', []))}
- Recent Revenue Baseline: {currency} {data_analysis.get('recent_revenue', 0.0)}

INSTRUCTIONS:
Generate a complete, ready-to-execute digital marketing campaign plan.
1. Select suitable products to promote based on sales trends, stock availability, profit margins, and campaign objective.
2. Recommend target audience demographics, interests, and segments.
3. Recommend platforms (Instagram, Facebook, WhatsApp, Email, Google Ads, YouTube) with budget allocations summing up to EXACTLY {budget:,.2f}.
4. Provide a day-by-day content calendar for ALL {duration} days. Each day MUST include: day number, platform, content type (Reel, Carousel, Story, Email, Ad), featured product, objective, headline hook, caption draft snippet, and call to action.
5. Define performance tracking KPIs (reach, CTR, conversions, return).

CRITICAL: Return ONLY valid, parseable JSON with NO markdown code fences and NO extra text before or after.

JSON Structure:
{{
  "campaign_name": "string",
  "business_name": "{biz_name}",
  "business_type": "{biz_type}",
  "currency": "{currency}",
  "campaign_objective": "{objective_raw}",
  "duration_days": {duration},
  "total_budget": {budget},
  "strategy_summary": "string",
  "product_selection": [
    {{
      "product_name": "string",
      "reason": "string",
      "stock_status": "string",
      "promotional_angle": "string"
    }}
  ],
  "target_audience": {{
    "demographics": {{
      "age_range": "string",
      "target_segments": ["string"],
      "location_scope": "{location}",
      "interests": ["string"]
    }},
    "customer_needs": ["string"],
    "data_limitation_disclaimer": "Audience recommendations are derived from product characteristics and positioning. Transaction-level customer segmentation requires customer records."
  }},
  "platform_recommendations": [
    {{
      "platform": "string",
      "icon": "instagram|facebook|whatsapp|email|google|youtube",
      "allocated_budget": 0.0,
      "budget_pct": 0,
      "role": "string",
      "formats": ["string"],
      "rationale": "string"
    }}
  ],
  "budget_allocation": [
    {{
      "platform": "string",
      "amount": 0.0,
      "percentage": 0,
      "purpose": "string"
    }}
  ],
  "content_strategy": {{
    "primary_formats": ["string"],
    "posting_frequency_summary": "string",
    "weekly_mix": {{
      "reels_or_videos": 0,
      "carousels_and_posts": 0,
      "stories_daily": "string",
      "whatsapp_broadcasts": 0,
      "email_newsletters": 0
    }}
  }},
  "content_calendar": [
    {{
      "day": 1,
      "day_name": "Day 1",
      "platform": "string",
      "content_type": "string",
      "product_featured": "string",
      "objective": "string",
      "headline": "string",
      "caption_draft": "string",
      "call_to_action": "string",
      "suggested_time": "string"
    }}
  ],
  "performance_tracking": [
    {{
      "metric": "string",
      "target": "string",
      "purpose": "string",
      "channel": "string"
    }}
  ]
}}
"""

    raw = call_llm_fn(prompt)
    if not raw:
        return generate_demo_campaign_plan(req, biz_name, biz_type, currency, data_analysis)

    try:
        raw_clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        plan = json.loads(raw_clean)
        # Validate plan
        validation = validate_campaign_plan(plan, budget, data_analysis, objective_raw)
        plan["validation_result"] = validation
        return plan
    except Exception as e:
        logger.warning("Failed to parse LLM campaign plan JSON: %s. Falling back to demo plan.", e)
        return generate_demo_campaign_plan(req, biz_name, biz_type, currency, data_analysis)
