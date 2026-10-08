"""
AI / LLM Service
- Reads LLM_PROVIDER and LLM_API_KEY from environment.
- Supported providers:
    gemini  → uses google-genai SDK (google.genai)
    openai  → uses openai SDK v3.x  (openai.OpenAI)
- Falls back to DEMO MODE if LLM_API_KEY is not set.
- The LLM NEVER calculates metrics — it only explains pre-computed facts.
"""
import os
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
LLM_API_KEY  = os.getenv("LLM_API_KEY", "").strip()
DEMO_MODE    = not bool(LLM_API_KEY)


# ─────────────────── low-level LLM call ───────────────────

def _call_gemini(prompt: str) -> str:
    """
    Uses google-genai SDK (google.genai) — the current Google AI Python SDK.
    Package: google-genai  (NOT google-generativeai)
    """
    import warnings, logging
    # Suppress the AFC warning that google-genai prints to stderr — it is harmless
    logging.getLogger("google.genai").setLevel(logging.ERROR)
    warnings.filterwarnings("ignore", message=".*AFC.*")

    from google import genai
    from google.genai import types
    client = genai.Client(api_key=LLM_API_KEY)
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)
        ),
    )
    return response.text.strip()


def _call_openai(prompt: str) -> str:
    """
    Uses openai SDK v3.x  (latest on PyPI as of 2026).
    The v3.x API is compatible with the v1.x client interface.
    """
    from openai import OpenAI
    client = OpenAI(api_key=LLM_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
    )
    return response.choices[0].message.content.strip()


def _call_llm(prompt: str) -> Optional[str]:
    """Dispatch to the configured LLM provider. Returns None on failure or demo mode."""
    if DEMO_MODE:
        return None
    try:
        if LLM_PROVIDER == "gemini":
            return _call_gemini(prompt)
        elif LLM_PROVIDER == "openai":
            return _call_openai(prompt)
        else:
            logger.warning("Unknown LLM_PROVIDER '%s' — falling back to demo mode.", LLM_PROVIDER)
            return None
    except Exception as e:
        logger.error("LLM call failed: %s", e)
        return None


# ─────────────────── demo / mock responses ───────────────────

def _demo_insights(context: dict) -> dict:
    summary    = context.get("summary", {})
    revenue    = summary.get("total_revenue", 0)
    expenses   = summary.get("total_expenses", 0)
    profit     = summary.get("estimated_profit", 0)
    growth     = summary.get("sales_growth_pct")
    exp_growth = summary.get("expense_growth_pct")
    top        = context.get("top_products", [])
    low_stock  = context.get("low_stock_products", [])
    slow       = context.get("slow_moving_products", [])

    growth_text = (
        f"up {growth}%" if growth and growth > 0
        else (f"down {abs(growth)}%" if growth else "unchanged")
    )
    exp_text = f"up {exp_growth}%" if exp_growth and exp_growth > 0 else "stable"
    top_name  = top[0]["product_name"] if top else "N/A"
    low_names = ", ".join([p["name"] for p in low_stock]) if low_stock else None
    slow_names = ", ".join(slow[:3]) if slow else None

    summary_text = (
        f"[DEMO MODE — Add LLM_API_KEY to .env for real AI insights]\n\n"
        f"Revenue: {revenue:,.2f}  |  Expenses: {expenses:,.2f}  |  "
        f"Est. Profit: {profit:,.2f}\n"
        f"Sales are {growth_text} vs previous period. Expenses are {exp_text}. "
        f"Top product: {top_name}."
    )

    problems = []
    if exp_growth and growth is not None and exp_growth > growth:
        problems.append(f"Expenses grew ({exp_text}) faster than sales ({growth_text}), squeezing margins.")
    if low_stock:
        problems.append(f"Low stock: {', '.join(p['name'] for p in low_stock)}.")
    if profit < 0:
        problems.append("Business is currently operating at a loss.")
    if not problems:
        problems.append("No critical problems detected in the current period.")

    recommendations = [
        "Review expense categories to identify cost-cutting opportunities.",
        f"Focus marketing efforts on top product: {top_name}.",
    ]
    if low_names:
        recommendations.append(f"Restock low-inventory items: {low_names}.")
    if slow_names:
        recommendations.append(f"Run promotions for slow-moving products: {slow_names}.")

    action_plan = []
    for p in low_stock:
        action_plan.append({
            "priority": "HIGH",
            "issue":  f"{p['name']} is below reorder level ({p['current_stock']} remaining).",
            "action": f"Restock {p['name']} immediately.",
            "reason": "Stock-outs directly cause lost sales.",
        })
    if exp_growth and growth is not None and exp_growth > growth:
        action_plan.append({
            "priority": "HIGH",
            "issue":  "Expense growth is outpacing revenue growth.",
            "action": "Audit all expense categories and cut non-essential spending.",
            "reason": "Sustained expense growth erodes profitability.",
        })
    if slow_names:
        action_plan.append({
            "priority": "MEDIUM",
            "issue":  f"Products with no sales this period: {slow_names}.",
            "action": "Run a promotion or bundle deal to move slow inventory.",
            "reason": "Stagnant inventory ties up capital.",
        })
    if not action_plan:
        action_plan.append({
            "priority": "LOW",
            "issue":  "Business looks stable.",
            "action": "Continue monitoring key metrics weekly.",
            "reason": "Consistent tracking helps catch issues early.",
        })

    return {
        "summary":          summary_text,
        "key_problems":     problems,
        "recommendations":  recommendations,
        "action_plan":      action_plan,
    }


# ─────────────────── public functions ───────────────────

def generate_insights(context: dict, business_name: str, business_type: str) -> dict:
    """
    context = output of analytics.build_llm_context()
    All numbers in context are pre-computed by the analytics engine.
    The LLM only explains them.
    """
    if DEMO_MODE:
        return _demo_insights(context)

    summary   = context.get("summary", {})
    top       = context.get("top_products", [])
    low_stock = context.get("low_stock_products", [])
    slow      = context.get("slow_moving_products", [])

    prompt = f"""
You are a business analytics assistant for a small {business_type} business called "{business_name}".
You have been given VERIFIED metrics calculated directly from the database.
DO NOT invent any numbers. Use ONLY the facts provided below.

== VERIFIED METRICS ==
Period: {summary.get('period_label')}
Total Revenue: {summary.get('total_revenue')}
Total Expenses: {summary.get('total_expenses')}
Estimated Profit: {summary.get('estimated_profit')} (is_estimate: {summary.get('profit_is_estimate')})
Number of Sales Transactions: {summary.get('num_transactions')}
Average Transaction Value: {summary.get('avg_transaction_value')}
Sales Growth vs Previous Period: {summary.get('sales_growth_pct')}%
Expense Growth vs Previous Period: {summary.get('expense_growth_pct')}%
Top Products: {json.dumps(top)}
Low Stock Products: {json.dumps(low_stock)}
Slow Moving Products: {json.dumps(slow)}
Sales by Category: {json.dumps(context.get('sales_by_category', []))}
Expense by Category: {json.dumps(context.get('expense_by_category', []))}

== TASK ==
Respond with a valid JSON object using exactly these keys:
{{
  "summary": "2-3 sentence business summary using only the facts above",
  "key_problems": ["problem 1", "problem 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "action_plan": [
    {{"priority": "HIGH|MEDIUM|LOW", "issue": "...", "action": "...", "reason": "..."}}
  ]
}}
Rules:
- Generate 3-5 action plan items
- Do not include items not supported by the provided data
- Respond with ONLY the JSON object — no markdown fences, no extra text
"""
    raw = _call_llm(prompt)
    if raw is None:
        return _demo_insights(context)
    try:
        raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.error("LLM returned invalid JSON for insights, falling back to demo.")
        return _demo_insights(context)


def chat_with_data(question: str, context: dict, business_name: str, business_type: str) -> dict:
    """Answer a user question using verified business data."""
    if DEMO_MODE:
        s = context.get("summary", {})
        return {
            "reply": (
                f"[DEMO MODE — Add LLM_API_KEY to .env for real AI chat]\n\n"
                f'You asked: "{question}"\n\n'
                f"Current data snapshot — Revenue: {s.get('total_revenue', 0):,.2f} | "
                f"Expenses: {s.get('total_expenses', 0):,.2f} | "
                f"Est. Profit: {s.get('estimated_profit', 0):,.2f}."
            ),
            "data_used": s,
        }

    prompt = f"""
You are a business assistant for "{business_name}" ({business_type}).
Answer the user's question using ONLY the verified data below.
If the data does not contain enough information, say so clearly.
Do NOT invent numbers.

== VERIFIED DATA ==
{json.dumps(context, indent=2)}

== USER QUESTION ==
{question}

Provide a clear, concise answer in 2-4 sentences. Cite specific numbers from the data where relevant.
"""
    reply = _call_llm(prompt)
    if reply is None:
        return {"reply": "AI service unavailable. Check your API key in .env.", "data_used": None}
    return {"reply": reply, "data_used": context.get("summary")}


def extract_transaction_from_text(raw_text: str) -> dict:
    """Convert OCR/NLP raw text into a structured transaction dict."""
    if DEMO_MODE:
        return {
            "transaction_type": "sale",
            "product": None,
            "category": None,
            "quantity": None,
            "unit_price": None,
            "amount": None,
            "date": None,
            "description": raw_text[:200],
            "confidence": "low",
            "_demo_note": "Add LLM_API_KEY to .env for accurate extraction.",
        }

    prompt = f"""
Extract structured business transaction data from the text below.
Return ONLY a valid JSON object with these fields (use null for any field not found):
{{
  "transaction_type": "sale" or "purchase" or null,
  "product": "product name" or null,
  "category": "category" or null,
  "quantity": number or null,
  "unit_price": number or null,
  "amount": total amount as number or null,
  "date": "YYYY-MM-DD" or null,
  "description": "brief description",
  "confidence": "high" or "medium" or "low"
}}

Text: {raw_text}

Respond with ONLY the JSON object — no explanation, no markdown fences.
"""
    raw = _call_llm(prompt)
    if raw is None:
        return {"confidence": "low", "description": raw_text[:200]}
    try:
        raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"confidence": "low", "description": raw_text[:200]}


def explain_whatif(scenario: dict) -> str:
    """Generate a plain-English explanation of a what-if scenario."""
    if DEMO_MODE:
        return (
            f"[DEMO MODE] {scenario.get('scenario_description', '')} "
            f"Estimated change: {scenario.get('estimated_change_pct', 0):.1f}%. "
            "This is a simplified estimate based on historical averages. "
            "Add an LLM_API_KEY to .env for a detailed explanation."
        )

    prompt = f"""
Explain the following business what-if scenario in 2-3 plain sentences.
Be realistic. Clearly label the result as an estimate.
Do NOT invent data beyond what is provided.

Scenario details: {json.dumps(scenario)}

Respond with plain text only — no bullet points, no headers.
"""
    result = _call_llm(prompt)
    if result is None:
        return "AI explanation unavailable. The estimate is shown above."
    return result


def suggest_column_mappings(columns: list, standard_fields: list) -> dict:
    """
    Suggest CSV column → standard field mappings.
    Falls back to heuristic matching when in demo mode.
    """
    # Always try heuristic first (fast, no API cost)
    field_hints = {
        "date":             ["date", "day", "time", "when", "transaction date", "trans date"],
        "product":          ["product", "item", "name", "goods", "product name", "item name"],
        "category":         ["category", "type", "group", "dept", "department"],
        "quantity":         ["quantity", "qty", "units", "amount sold", "units sold", "no of units"],
        "unit_price":       ["price", "rate", "unit price", "selling price", "cost", "price per unit"],
        "total_amount":     ["total", "revenue", "amount", "value", "total amount", "sales", "total revenue"],
        "transaction_type": ["type", "transaction type", "trans type", "sale type"],
        "expense_category": ["expense", "expense category", "expense type", "cost category"],
        "description":      ["description", "notes", "remarks", "comment"],
    }
    mapping = {}
    for col in columns:
        col_lower = col.lower().strip()
        for field, hints in field_hints.items():
            if any(h in col_lower for h in hints):
                mapping[col] = field
                break

    # If we have an LLM, let it improve the heuristic result
    if not DEMO_MODE:
        unmapped = [c for c in columns if c not in mapping]
        if unmapped:
            prompt = f"""
Given these unmapped CSV column names: {unmapped}
Map each to the most appropriate standard field from: {standard_fields}
If a column doesn't match any field, map it to null.
Respond ONLY with a JSON object: {{"column_name": "field_name_or_null"}}
No markdown fences.
"""
            raw = _call_llm(prompt)
            if raw:
                try:
                    raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
                    llm_mapping = json.loads(raw)
                    mapping.update({k: v for k, v in llm_mapping.items() if v})
                except Exception:
                    pass

    return mapping


# ─────────────────── Social Media Content Generator ───────────────────

def _demo_social_content(req: dict, biz_name: str, biz_type: str, top_products: list = None) -> dict:
    """Generate high-quality platform-specific marketing copy for demo/offline mode."""
    platform = req.get("platform", "all")
    content_type = req.get("content_type", "promotional_offer")
    audience = req.get("target_audience") or "Valued local customers and families"
    goal = req.get("marketing_goal") or "Increase customer visits and order volume"
    product = req.get("product_or_topic") or (top_products[0]["product_name"] if top_products else "Special Featured Collection")
    tone = req.get("tone") or "Engaging & Friendly"
    offer = req.get("offer_details") or "Limited-time special prices this week only!"

    # Clean hashtags based on business type
    type_tags = {
        "grocery": ["#GroceryShopping", "#FreshFood", "#DailyEssentials", "#LocalMarket", "#HealthyLiving"],
        "clothing": ["#FashionStyle", "#OOTD", "#NewArrivals", "#BoutiqueShopping", "#StyleInspo"],
        "restaurant": ["#Foodie", "#DeliciousEats", "#FoodLovers", "#DiningOut", "#ChefSpecial"],
        "retail": ["#RetailTherapy", "#ShopLocal", "#BestDeals", "#StoreDiscounts", "#QualityProducts"],
    }.get(biz_type, ["#SmallBusiness", "#ShopLocal", "#CustomerFirst", "#BestDeals"])

    general_tags = ["#TrendingNow", "#LimitedOffer", "#WeekendVibes", "#SpecialDiscount", f"#{biz_name.replace(' ', '')}"]
    all_hashtags = list(dict.fromkeys(type_tags + general_tags))

    # Instagram
    ig_caption = f"""✨ Don't miss out on {product}! ✨

Looking for quality you can trust? At {biz_name}, we've curated the best for our community! 🎉

🔥 {offer}
🎯 Perfect for: {audience}

Whether you're shopping for yourself or your loved ones, we guarantee the best experience and honest prices every single day.

👇 How to order:
1️⃣ Drop by our store today!
2️⃣ Or send us a DM / WhatsApp message to reserve your order before stock runs out!

💬 Double-tap if you love quality deals! Tag a friend who needs to see this! 👇"""

    # Facebook
    fb_caption = f"""🌟 Special Announcement from {biz_name} 🌟

Hello friends and neighbors! We're thrilled to introduce our featured {product} highlights this week. 

🎯 {goal}:
We know how important quality and value are for {audience}. That's why we're offering:
👉 {offer}

Come visit us in store, or give us a quick call/message to reserve yours today!

Question for our community: What's your favorite pick from our collection? Drop your thoughts in the comments below! 👇"""

    # WhatsApp
    wa_message = f"""*🔥 EXCLUSIVE UPDATE FROM {biz_name.upper()} 🔥*

Dear Customer,

We have an exciting special for you! 🎉

✨ *Featured Item:* {product}
🏷️ *Offer:* {offer}
🎯 *Ideal for:* {audience}

⚡ *Limited Stock Available!*
Order directly via WhatsApp before stock runs out.

👉 *Reply "ORDER" or call us now to reserve your item!*
Thank you for supporting {biz_name}! 🙏"""

    # LinkedIn
    li_post = f"""Delivering consistent value to our community at {biz_name}. 📈

In retail and operations, meeting customer expectations requires focusing on product excellence, reliable supply chains, and customer delight.

This week, we are proud to spotlight our {product} initiatives tailored specifically for {audience}. 

Key Milestone / Offer:
• {offer}
• Marketing Objective: {goal}
• Commitment to local excellence and customer trust.

How is your organization approaching customer retention this quarter? Looking forward to your perspectives in the comments.

#BusinessGrowth #RetailOperations #Leadership #CustomerExperience #{biz_name.replace(' ', '')}"""

    return {
        "business_name": biz_name,
        "business_type": biz_type,
        "product_or_topic": product,
        "marketing_goal": goal,
        "target_audience": audience,
        "tone": tone,
        "platforms": {
            "instagram": {
                "hook": f"✨ Elevate your everyday with {product} at {biz_name}!",
                "caption": ig_caption,
                "hashtags": all_hashtags,
                "cta": "Tap the link in bio or DM us 'INFO' to secure yours today!",
                "story_idea": f"Record a 15-second close-up reel showcasing {product} with upbeat trending audio.",
                "reel_audio_tip": "Upbeat acoustic lo-fi or trending upbeat pop rhythm."
            },
            "facebook": {
                "headline": f"Exclusive Special: Discover {product} at {biz_name}",
                "caption": fb_caption,
                "hashtags": all_hashtags[:6],
                "cta": "Click 'Send Message' or visit our shop to claim this offer!",
                "engagement_question": "What's your go-to item when you visit us? Share in the comments below!"
            },
            "whatsapp": {
                "headline": f"Special Alert: {product} now available at {biz_name}",
                "message": wa_message,
                "cta": "Reply 'YES' to place your instant order with free store pickup!",
                "urgency_badge": "⚡ Limited Stock Remaining"
            },
            "linkedin": {
                "headline": f"Customer-centric operations & quality assurance at {biz_name}",
                "post": li_post,
                "hashtags": ["#RetailExcellence", "#SmallBusinessLeadership", "#CustomerCentric", "#SupplyChain"],
                "cta": "Connect with us or share your thoughts on seasonal retail demand below.",
                "key_takeaway": f"Maintaining customer loyalty through consistent value: {offer}."
            }
        },
        "ad_copy": {
            "catchy_headlines": [
                f"Upgrade to {product} Today at {biz_name}!",
                f"{offer} — Don't Miss Out!",
                f"Premium Quality, Unbeatable Value: Shop {biz_name}."
            ],
            "primary_ad_text": f"Looking for {product}? Experience verified quality and customer-first service at {biz_name}. {offer} Claim your deal now!",
            "short_punchline": f"{biz_name} — Quality you trust, prices you love."
        },
        "call_to_actions": {
            "urgent": f"⚡ Hurry! {offer} — Only while supplies last!",
            "conversational": "💬 Got questions? Send us a DM or reply to this message anytime!",
            "direct_order": "🛒 Visit our store or reply 'ORDER' to get yours today!"
        },
        "best_time_to_post": {
            "instagram": "12:00 PM – 2:00 PM & 7:00 PM – 9:00 PM",
            "facebook": "1:00 PM – 4:00 PM (Thursday – Sunday)",
            "whatsapp": "9:30 AM – 11:30 AM & 6:30 PM",
            "linkedin": "8:00 AM – 10:00 AM (Tuesday – Thursday)"
        }
    }


def generate_social_content(req: dict, biz_name: str, biz_type: str, top_products: list = None) -> dict:
    """
    Generate platform-specific social media captions, CTAs, ad copy, and hashtags
    using Gemini / OpenAI, falling back to rich demo mode.
    """
    if DEMO_MODE:
        return _demo_social_content(req, biz_name, biz_type, top_products)

    product = req.get("product_or_topic") or (top_products[0]["product_name"] if top_products else "Featured Store Offering")
    audience = req.get("target_audience") or "Local customers and regulars"
    goal = req.get("marketing_goal") or "Boost sales and engagement"
    tone = req.get("tone") or "Engaging, Authentic & Persuasive"
    offer = req.get("offer_details") or "Special promotional pricing available now"
    platform = req.get("platform", "all")
    notes = req.get("additional_notes", "")

    prompt = f"""You are an elite commercial copywriter and social media marketing strategist for small-to-medium businesses.
Create high-converting, platform-tailored social media marketing copy for the following business:

BUSINESS INFORMATION:
- Name: {biz_name}
- Industry/Type: {biz_type}
- Product or Focal Topic: {product}
- Target Audience: {audience}
- Primary Marketing Goal: {goal}
- Brand Voice / Tone: {tone}
- Special Offer / Promotion: {offer}
- Requested Platform Scope: {platform}
- Additional Merchant Notes: {notes}

INSTRUCTIONS:
Generate tailored content formatted specifically for:
1. Instagram (Visual hook, emoji spacing, engaging line breaks, 15-20 niche hashtags, story/reel idea, CTA).
2. Facebook (Conversational community storytelling, link preview, question to drive comments, 3-5 hashtags, CTA).
3. WhatsApp (Clean broadcast message with *bold* formatting, bullet emojis, direct conversational CTA, urgency tag).
4. LinkedIn (Professional founder / operations story, quality focus, business value, professional CTA, 3-5 hashtags).
5. Ad Copy (3 distinct punchy headlines, primary ad copy, short punchline).
6. 3 Call-To-Action variations (Urgent, Conversational, Direct Order).
7. Best posting times recommendation for each channel.

CRITICAL: Return ONLY valid, parseable JSON with NO markdown code fences and NO other text before or after.
JSON Structure:
{{
  "business_name": "{biz_name}",
  "business_type": "{biz_type}",
  "product_or_topic": "{product}",
  "marketing_goal": "{goal}",
  "target_audience": "{audience}",
  "tone": "{tone}",
  "platforms": {{
    "instagram": {{
      "hook": "string",
      "caption": "string",
      "hashtags": ["#tag1", "#tag2"],
      "cta": "string",
      "story_idea": "string",
      "reel_audio_tip": "string"
    }},
    "facebook": {{
      "headline": "string",
      "caption": "string",
      "hashtags": ["#tag1", "#tag2"],
      "cta": "string",
      "engagement_question": "string"
    }},
    "whatsapp": {{
      "headline": "string",
      "message": "string",
      "cta": "string",
      "urgency_badge": "string"
    }},
    "linkedin": {{
      "headline": "string",
      "post": "string",
      "hashtags": ["#tag1", "#tag2"],
      "cta": "string",
      "key_takeaway": "string"
    }}
  }},
  "ad_copy": {{
    "catchy_headlines": ["headline 1", "headline 2", "headline 3"],
    "primary_ad_text": "string",
    "short_punchline": "string"
  }},
  "call_to_actions": {{
    "urgent": "string",
    "conversational": "string",
    "direct_order": "string"
  }},
  "best_time_to_post": {{
    "instagram": "string",
    "facebook": "string",
    "whatsapp": "string",
    "linkedin": "string"
  }}
}}
"""

    raw = _call_llm(prompt)
    if not raw:
        return _demo_social_content(req, biz_name, biz_type, top_products)

    try:
        raw_clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(raw_clean)
        return data
    except Exception as e:
        logger.warning("Failed to parse LLM social media response as JSON: %s. Using demo format.", e)
        return _demo_social_content(req, biz_name, biz_type, top_products)


# ─────────────────── AI Creative Studio (Images & Videos) ───────────────────

_STYLE_ENHANCERS = {
    "photorealistic": "Ultra-sharp 8K commercial product photography, Canon EOS R5 85mm f/1.4 lens, diffused softbox lighting, shallow depth of field, elegant reflections, premium studio staging.",
    "minimalist_studio": "Minimalist Scandinavian design, clean pastel backdrop, subtle soft shadows, high-end editorial composition, modern geometric props, organic textures.",
    "luxury_editorial": "Vogue commercial aesthetic, moody chiaroscuro lighting, deep gold and obsidian accents, cinematic 35mm film grain, high-fashion luxury atmosphere.",
    "vibrant_pop": "Bold saturated pop colors, dynamic neon rim lighting, electric teal and magenta highlights, high energy visual punch, trending modern advertising.",
    "festive_flyer": "Warm golden sparkles, festive celebratory lighting, elegant festive garlands, warm holiday glow, premium celebratory retail showcase.",
    "3d_render": "Modern 3D clay and glass render, Octane render 8K, smooth ambient occlusion, cute isometric perspective, pastel candy gradient backdrop."
}

_STOCK_PREVIEWS = {
    "food": [
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
    ],
    "fashion": [
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    ],
    "tech": [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80",
    ],
    "coffee": [
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80",
    ],
    "default": [
        "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80",
    ]
}


def _pick_stock_image(query: str, index: int = 0) -> str:
    q = query.lower()
    if any(k in q for k in ["food", "restaurant", "cafe", "pizza", "burger", "meal", "cake", "bakery", "snack"]):
        category = "food"
    elif any(k in q for k in ["fashion", "cloth", "dress", "shirt", "shoe", "wear", "jewelry", "beauty"]):
        category = "fashion"
    elif any(k in q for k in ["tech", "gadget", "phone", "headphone", "audio", "laptop", "smart", "device"]):
        category = "tech"
    elif any(k in q for k in ["coffee", "tea", "espresso", "latte", "brew"]):
        category = "coffee"
    else:
        category = "default"
    images = _STOCK_PREVIEWS[category]
    return images[index % len(images)]


def generate_marketing_image(req: dict, biz_name: str, biz_type: str) -> dict:
    """
    Generates promotional visual imagery using Google GenAI (Imagen 3 / 4) or
    a commercial intelligent fallback studio when offline or on quota limits.
    """
    user_prompt = req.get("prompt", "").strip() or f"Special promotional offer for {biz_name}"
    product_name = req.get("product_name", "").strip()
    style_key = req.get("style", "photorealistic")
    aspect_ratio = req.get("aspect_ratio", "1:1")
    headline = req.get("text_headline", "").strip() or f"Discover {product_name or biz_name}"
    discount_tag = req.get("discount_tag", "").strip() or "Special Offer"
    color_theme = req.get("color_theme", "").strip()

    enhancement = _STYLE_ENHANCERS.get(style_key, _STYLE_ENHANCERS["photorealistic"])
    subject = f"Commercial product shot of {product_name}" if product_name else f"Commercial hero advertisement for {biz_name} ({biz_type})"
    full_prompt = (
        f"{subject}. {user_prompt}. "
        f"{enhancement} "
        f"{f'Color palette accent: {color_theme}. ' if color_theme else ''}"
        f"Masterpiece, award-winning advertising banner, clean professional aesthetics."
    )

    image_url = None
    source = "smart_canvas"

    # Attempt real Imagen generation via google-genai SDK if enabled
    if not DEMO_MODE and LLM_PROVIDER == "gemini":
        try:
            import base64
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=LLM_API_KEY)
            # Supported aspect ratios for Imagen: "1:1", "16:9", "9:16", "4:3", "3:4"
            valid_ar = aspect_ratio if aspect_ratio in ["1:1", "16:9", "9:16", "4:3", "3:4"] else "1:1"
            logger.info("Calling Gemini Imagen model for image generation...")
            resp = client.models.generate_images(
                model="imagen-3.0-generate-002",
                prompt=full_prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio=valid_ar,
                    output_mime_type="image/jpeg",
                ),
            )
            if resp and resp.generated_images:
                img_data = resp.generated_images[0].image.image_bytes
                b64 = base64.b64encode(img_data).decode("utf-8")
                image_url = f"data:image/jpeg;base64,{b64}"
                source = "gemini_imagen"
                logger.info("Successfully generated image with Gemini Imagen 3!")
        except Exception as e:
            logger.warning("Gemini Imagen call failed or not available on this tier: %s. Using smart commercial visual.", e)

    # Fallback to high-res commercial visual
    if not image_url:
        search_key = f"{biz_type} {product_name} {user_prompt}"
        image_url = _pick_stock_image(search_key, 0)
        source = "smart_commercial"

    return {
        "status": "success",
        "image_url": image_url,
        "prompt": user_prompt,
        "enhanced_prompt": full_prompt,
        "style": style_key,
        "aspect_ratio": aspect_ratio,
        "headline": headline,
        "discount_tag": discount_tag,
        "business_name": biz_name,
        "product_name": product_name,
        "source": source,
        "camera_meta": {
            "lens": "85mm f/1.4 Art Lens",
            "lighting": "Dual softbox with subtle rim light",
            "resolution": "4K Ultra-HD HDR",
            "aspect_ratio": aspect_ratio
        },
        "caption_snippet": f"🔥 {headline}! Check out our {product_name or 'latest collection'} at {biz_name}. {discount_tag}! Link in bio to explore.",
        "hashtags": [
            f"#{biz_name.replace(' ', '').lower()}",
            f"#{style_key.replace('_', '')}",
            "#productlaunch",
            "#exclusiveoffer",
            "#supportlocal",
            "#smallbusiness"
        ]
    }


def generate_marketing_video(req: dict, biz_name: str, biz_type: str) -> dict:
    """
    Generates a high-converting scene-by-scene commercial video storyboard and script
    tailored for Instagram Reels, TikTok, YouTube Shorts, and promotional ads.
    """
    user_prompt = req.get("prompt", "").strip() or f"Promote {biz_name}'s best-selling products and services"
    product_name = req.get("product_name", "").strip()
    video_type = req.get("video_type", "product_reel")
    aspect_ratio = req.get("aspect_ratio", "9:16")
    duration = int(req.get("duration_seconds", 15))
    platform = req.get("target_platform", "instagram_reels")
    tone = req.get("tone", "High-Energy & Trendy")

    prompt = f"""You are an elite short-form video creative director and commercial advertising director for Instagram Reels, TikTok, and YouTube Shorts.
Create a high-retention, high-converting video commercial storyboard and voiceover script for the following business:

BUSINESS INFORMATION:
- Name: {biz_name}
- Industry/Type: {biz_type}
- Focal Product: {product_name or 'Signature Offerings'}
- Campaign Goal / User Prompt: {user_prompt}
- Video Style / Type: {video_type}
- Duration Target: {duration} seconds
- Aspect Ratio: {aspect_ratio} (e.g. 9:16 vertical reel)
- Target Platform: {platform}
- Tone / Vibe: {tone}

INSTRUCTIONS:
1. Divide the video into 3 to 5 fast-paced scenes matching the {duration} second duration.
2. Scene 1 MUST be a 3-second hook that stops users from scrolling.
3. Middle scenes must present the problem, showcase the product/value, and build excitement.
4. Final scene must have a high-converting call to action.
5. Provide exact on-screen kinetic text, spoken voiceover, sound design cue, camera motion, and visual descriptions.
6. Provide a consolidated full voiceover script for text-to-speech.
7. Provide a detailed prompt ready for Veo 3.1 video generation.

CRITICAL: Return ONLY valid, parseable JSON with NO markdown code fences and NO other text before or after.
JSON Structure:
{{
  "title": "string",
  "concept": "string",
  "hook_headline": "string",
  "duration_seconds": {duration},
  "aspect_ratio": "{aspect_ratio}",
  "platform": "{platform}",
  "music_track": {{
    "title": "string",
    "vibe": "string",
    "bpm": 128
  }},
  "full_voiceover_script": "string",
  "scenes": [
    {{
      "scene_number": 1,
      "duration": 3,
      "phase": "Hook",
      "visual_description": "string",
      "on_screen_text": "string",
      "voiceover": "string",
      "camera_motion": "string",
      "sound_fx": "string",
      "transition": "string"
    }}
  ],
  "veo_generation_prompt": "string",
  "hashtags": ["#reel", "#trending"]
}}
"""

    raw = _call_llm(prompt)
    if not raw:
        return _demo_video_storyboard(req, biz_name, biz_type)

    try:
        raw_clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(raw_clean)
        # Attach preview image links to scenes
        search_key = f"{biz_type} {product_name}"
        for i, sc in enumerate(data.get("scenes", [])):
            sc["preview_image"] = _pick_stock_image(search_key, i)
        return data
    except Exception as e:
        logger.warning("Failed to parse LLM video storyboard response: %s. Using demo format.", e)
        return _demo_video_storyboard(req, biz_name, biz_type)


def _demo_video_storyboard(req: dict, biz_name: str, biz_type: str) -> dict:
    product = req.get("product_name") or "Signature Collection"
    duration = int(req.get("duration_seconds", 15))
    aspect_ratio = req.get("aspect_ratio", "9:16")
    platform = req.get("target_platform", "instagram_reels")
    search_key = f"{biz_type} {product}"

    scenes = [
        {
            "scene_number": 1,
            "duration": 3,
            "phase": "Scroll-Stopping Hook",
            "visual_description": f"Fast-paced dynamic macro zoom into {product} with cinematic lighting and steam/sparkles.",
            "on_screen_text": f"Wait! Have you seen this at {biz_name}? 👀",
            "voiceover": f"Stop scrolling! If you haven't checked out {biz_name} yet, you're missing out.",
            "camera_motion": "Fast push-in with subtle lens flare",
            "sound_fx": "Punchy bass drop + cinematic swoosh",
            "preview_image": _pick_stock_image(search_key, 0),
            "transition": "Whip pan right"
        },
        {
            "scene_number": 2,
            "duration": 4,
            "phase": "Problem & Reveal",
            "visual_description": f"Split comparison showing ordinary alternatives vs the premium quality of {product}.",
            "on_screen_text": "Tired of settling for average? ⚡",
            "voiceover": f"No more compromises. We brought together top-tier quality and unbeatable value.",
            "camera_motion": "Smooth horizontal slider tracking across product",
            "sound_fx": "Rhythmic high-hat build up",
            "preview_image": _pick_stock_image(search_key, 1),
            "transition": "Flash dissolve"
        },
        {
            "scene_number": 3,
            "duration": 5,
            "phase": "Product Showcase",
            "visual_description": f"Satisfying 360-degree orbit shot showcasing texture, craftsmanship, and vibrant details of {product}.",
            "on_screen_text": f"Crafted with perfection 🌟 Top rated by locals",
            "voiceover": f"From premium ingredients to handcrafted precision, every single detail is made for you.",
            "camera_motion": "Slow motion 60fps rotating orbit",
            "sound_fx": "Subtle bell chime & uplifting melodic drop",
            "preview_image": _pick_stock_image(search_key, 2),
            "transition": "Zoom out"
        },
        {
            "scene_number": 4,
            "duration": 3,
            "phase": "Irresistible Call to Action",
            "visual_description": f"Bold branded end-screen featuring {biz_name} logo, address/website, and animated promo tag.",
            "on_screen_text": "🔥 Limited Time Offer! Tap link in bio to order now",
            "voiceover": f"Visit {biz_name} today or tap the link in bio before this offer ends!",
            "camera_motion": "Static punchy hero lock-off",
            "sound_fx": "Crisp digital chime + applause tap",
            "preview_image": _pick_stock_image(search_key, 0),
            "transition": "Fade to brand logo"
        }
    ]

    return {
        "title": f"{biz_name} - {product} Viral Promo",
        "concept": f"High-energy viral commercial showcasing {product} with fast visual hooks and customer-centric value propositions.",
        "hook_headline": f"The #1 reason everyone is obsessed with {biz_name}!",
        "duration_seconds": duration,
        "aspect_ratio": aspect_ratio,
        "platform": platform,
        "music_track": {
            "title": "Neon Rush (Lo-Fi Trap Pop)",
            "vibe": "Energetic, driving bass, crisp modern percussion",
            "bpm": 128
        },
        "full_voiceover_script": f"Stop scrolling! If you haven't checked out {biz_name} yet, you're missing out. No more compromises. We brought together top-tier quality and unbeatable value with {product}. From premium ingredients to handcrafted precision, every single detail is made for you. Visit {biz_name} today or tap the link in bio before this offer ends!",
        "scenes": scenes,
        "veo_generation_prompt": f"A cinematic commercial 9:16 vertical video for {biz_name} featuring {product}. Fast camera moves, warm studio lighting, 4k ultra-detailed commercial grade aesthetic.",
        "hashtags": [
            f"#{biz_name.replace(' ', '').lower()}",
            "#reelsviral",
            "#trendingnow",
            "#smallbusinesscheck",
            "#musttry",
            "#supportlocal"
        ]
    }


# ─────────────────── AI-Powered Digital Marketing Campaign Planner ───────────────────

def generate_campaign_planner(db, business_id: int, req: dict, biz_name: str, biz_type: str, currency: str = "INR") -> dict:
    """
    Analyzes products, sales, inventory, profit margins, and campaign objectives
    to generate a complete digital marketing campaign strategy, content calendar, and validator report.
    """
    from services import campaign_planner
    data_analysis = campaign_planner.analyze_business_data_for_campaign(
        db, business_id, req.get("selected_product_ids")
    )
    call_llm_fn = None if DEMO_MODE else _call_llm
    result = campaign_planner.generate_campaign_plan(
        req, biz_name, biz_type, currency, data_analysis, call_llm_fn
    )
    result["data_analysis_summary"] = data_analysis
    return result



