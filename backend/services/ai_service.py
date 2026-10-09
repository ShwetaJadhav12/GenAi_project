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


def generate_social_content(req: dict, biz_name: str, biz_type: str, top_products: list = None, catalog: list = None, location: str = "", currency: str = "INR") -> dict:
    """
    Generate platform-specific social media captions, CTAs, ad copy, and hashtags
    using Gemini / OpenAI, falling back to rich demo mode.
    """
    if DEMO_MODE:
        return _demo_social_content(req, biz_name, biz_type, top_products)

    catalog_names = [p["name"] for p in (catalog or []) if isinstance(p, dict) and p.get("name")]
    default_product = catalog_names[0] if catalog_names else (top_products[0]["product_name"] if top_products else "Featured Store Offering")
    product = (req.get("product_or_topic") or "").strip() or default_product
    audience = (req.get("target_audience") or "").strip() or f"Local customers and residents in {location or 'the neighbourhood'}"
    goal = (req.get("marketing_goal") or "").strip() or "Boost store sales and customer engagement"
    tone = (req.get("tone") or "").strip() or "Engaging, Authentic & Persuasive"
    offer = (req.get("offer_details") or "").strip() or "Special promotional pricing available now"
    platform = req.get("platform") or "all"
    notes = (req.get("additional_notes") or "").strip()
    inventory_summary = ", ".join(catalog_names[:6]) if catalog_names else "Fresh signature products"

    prompt = f"""You are an elite commercial copywriter and social media marketing strategist for small-to-medium businesses.
Create high-converting, platform-tailored social media marketing copy for the following business:

BUSINESS INFORMATION:
- Name: {biz_name}
- Industry/Type: {biz_type}
- Location: {location or 'Local Market'}
- Store Products in Catalog: {inventory_summary}
- Product or Focal Topic for this Campaign: {product}
- Target Audience: {audience}
- Primary Marketing Goal: {goal}
- Brand Voice / Tone: {tone}
- Special Offer / Promotion: {offer}
- Requested Platform Scope: {platform}
- Additional Merchant Notes: {notes}

GROUNDING REQUIREMENT:
All copy, hooks, and hashtags MUST be authentically tailored to a real {biz_type} business ({biz_name}) operating in {location or 'the local area'}. Mention authentic product aspects of {product}.


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
    "fashion": [
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
    ],
    "bakery": [
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
    ],
    "grocery": [
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1200&q=80",
    ],
    "restaurant": [
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
    ],
    "coffee": [
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80",
    ],
    "jewelry": [
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80",
    ],
    "beauty": [
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1200&q=80",
    ],
    "tech": [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80",
    ],
    "fitness": [
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
    ],
    "home": [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80",
    ],
    "default": [
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80",
    ]
}


def _pick_stock_image(query: str, index: int = 0) -> str:
    q = query.lower()
    if any(k in q for k in ["fashion", "cloth", "dress", "shirt", "pant", "shoe", "wear", "apparel", "saree", "kurti", "jeans", "boutique", "suit", "garment", "textile", "handmade"]):
        category = "fashion"
    elif any(k in q for k in ["bakery", "bake", "bread", "cake", "pastry", "cookie", "sourdough", "croissant", "donut", "dessert", "sweet"]):
        category = "bakery"
    elif any(k in q for k in ["grocery", "groceries", "kirana", "supermarket", "provision", "vegetable", "fruit", "rice", "dal", "flour", "oil", "organic", "spice", "grain", "staple"]):
        category = "grocery"
    elif any(k in q for k in ["cafe", "coffee", "tea", "espresso", "latte", "brew", "cappuccino", "chai"]):
        category = "coffee"
    elif any(k in q for k in ["restaurant", "dining", "dish", "meal", "kitchen", "thali", "biryani", "pizza", "burger", "chef", "hotel", "dine", "eatery"]):
        category = "restaurant"
    elif any(k in q for k in ["jewelry", "jewel", "gold", "silver", "diamond", "ring", "necklace", "bangle", "earring", "ornament", "gem"]):
        category = "jewelry"
    elif any(k in q for k in ["beauty", "salon", "spa", "cosmetic", "skincare", "hair", "makeup", "lotion", "perfume", "parlour"]):
        category = "beauty"
    elif any(k in q for k in ["tech", "electronic", "mobile", "phone", "gadget", "headphone", "audio", "laptop", "computer", "tv", "appliance"]):
        category = "tech"
    elif any(k in q for k in ["gym", "fitness", "workout", "sport", "yoga", "supplement", "protein"]):
        category = "fitness"
    elif any(k in q for k in ["home", "furniture", "decor", "curtain", "bedsheet", "kitchenware", "utensil", "sofa", "interior"]):
        category = "home"
    else:
        category = "default"
    images = _STOCK_PREVIEWS.get(category, _STOCK_PREVIEWS["default"])
    return images[index % len(images)]


def generate_marketing_image(req: dict, biz_name: str, biz_type: str, catalog: list = None, location: str = "", currency: str = "INR") -> dict:
    """
    Generates promotional visual imagery using Google GenAI (Imagen 3 / 4) or
    a commercial intelligent fallback studio when offline or on quota limits.
    Strictly grounded in user business type, catalog, and location.
    """
    catalog_names = [p["name"] for p in (catalog or []) if isinstance(p, dict) and p.get("name")]
    default_product = catalog_names[0] if catalog_names else ""
    product_name = (req.get("product_name") or "").strip() or default_product

    user_prompt = (req.get("prompt") or "").strip() or f"Special promotional offer for {product_name or biz_name}"
    style_key = req.get("style") or "photorealistic"
    aspect_ratio = req.get("aspect_ratio") or "1:1"

    # Business & Product & Theme specific headline generation
    if not (req.get("text_headline") or "").strip():
        bt = (biz_type or "").lower()
        pr = (user_prompt or "").lower()
        pn = product_name or ""

        if any(k in pr for k in ["festival", "diwali", "eid", "christmas", "celebrat", "holiday"]):
            headline = f"Festive Celebration with {pn or biz_name}"
        elif any(k in pr for k in ["weekend", "flash sale", "clearance", "discount", "mega sale"]):
            headline = f"Weekend Flash Sale on {pn or 'All Collections'}"
        elif any(k in pr for k in ["new arrival", "launch", "latest", "trend", "season"]):
            headline = f"New Season Drop: {pn or 'Latest Arrivals'}"
        elif any(k in pr for k in ["bestseller", "favorite", "top rated"]):
            headline = f"Rated #1 Customer Favorite: {pn or biz_name}"
        elif any(k in bt for k in ["bakery", "cake", "sweet"]):
            headline = f"Fresh From Our Oven: {pn or 'Daily Bakes'}"
        elif any(k in bt for k in ["restaurant", "cafe", "food"]):
            headline = f"Chef's Special: {pn or 'Signature Dishes'}"
        elif any(k in bt for k in ["grocery", "supermarket", "kirana"]):
            headline = f"Daily Fresh Deals on {pn or 'Groceries'}"
        elif any(k in bt for k in ["fashion", "clothing", "boutique"]):
            headline = f"Trending Style: {pn or 'New Collection'}"
        elif any(k in bt for k in ["jewelry", "gold"]):
            headline = f"Pure Elegance: {pn or 'Fine Jewelry'}"
        elif any(k in bt for k in ["tech", "electronic"]):
            headline = f"Smart Tech Deals on {pn or 'Gadgets'}"
        else:
            headline = f"Exclusive Special on {pn or biz_name}"
    else:
        headline = req.get("text_headline").strip()

    sym = "₹" if currency == "INR" else "$"
    discount_tag = (req.get("discount_tag") or "").strip() or f"Special Offer"
    color_theme = (req.get("color_theme") or "").strip()

    enhancement = _STYLE_ENHANCERS.get(style_key, _STYLE_ENHANCERS["photorealistic"])
    loc_str = f" in {location}" if location else ""
    catalog_str = f"Store catalog includes: {', '.join(catalog_names[:5])}." if catalog_names else ""

    subject = f"Commercial product shot of {product_name} from {biz_name} ({biz_type}{loc_str})" if product_name else f"Commercial hero advertising poster for {biz_name} ({biz_type}{loc_str})"
    full_prompt = (
        f"{subject}. {user_prompt}. {catalog_str} "
        f"Aesthetic style: {enhancement} "
        f"The visual MUST be specifically and accurately themed for a real {biz_type} business. "
        f"{f'Color palette accent: {color_theme}. ' if color_theme else ''}"
        f"Masterpiece, award-winning commercial advertising photography, flawless composition, high detail."
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


def generate_marketing_video(req: dict, biz_name: str, biz_type: str, catalog: list = None, location: str = "", currency: str = "INR") -> dict:
    """
    Generates a high-converting scene-by-scene commercial video storyboard and script
    tailored for Instagram Reels, TikTok, YouTube Shorts, and promotional ads.
    Grounds scenes and voiceover in user's business industry, products, and location.
    """
    catalog_names = [p["name"] for p in (catalog or []) if isinstance(p, dict) and p.get("name")]
    default_product = catalog_names[0] if catalog_names else "Signature Collection"
    product_name = (req.get("product_name") or "").strip() or default_product
    user_prompt = (req.get("prompt") or "").strip() or f"Promote {biz_name}'s best-selling products and special offers"
    video_type = req.get("video_type") or "product_reel"
    aspect_ratio = req.get("aspect_ratio") or "9:16"
    duration = int(req.get("duration_seconds") or 15)
    platform = req.get("target_platform") or "instagram_reels"
    tone = req.get("tone") or "High-Energy & Trendy"
    loc_str = f" in {location}" if location else ""
    catalog_summary = ", ".join(catalog_names[:6]) if catalog_names else f"{biz_type} items"

    prompt = f"""You are an elite short-form video creative director and commercial advertising director for Instagram Reels, TikTok, and YouTube Shorts.
Create a high-retention, high-converting video commercial storyboard and voiceover script for the following business:

BUSINESS INFORMATION:
- Name: {biz_name}
- Industry/Type: {biz_type}
- Location: {location or 'Local Market'}
- Store Products in Catalog: {catalog_summary}
- Focal Product for this Video: {product_name}
- Campaign Goal / User Prompt: {user_prompt}
- Video Style / Type: {video_type}
- Duration Target: {duration} seconds
- Aspect Ratio: {aspect_ratio} (e.g. 9:16 vertical reel)
- Target Platform: {platform}
- Tone / Vibe: {tone}

CRITICAL GROUNDING REQUIREMENTS:
1. Every scene, visual description, camera movement, kinetic on-screen text, and voiceover line MUST strictly belong to a real {biz_type} business ({biz_name}) operating in {location or 'the local area'}.
2. Feature {product_name} and related products authentically ({catalog_summary}).
3. For food/bakery/restaurant, describe appetizing textures, fresh dough/ovens/ingredients, dining ambiance.
4. For clothing/fashion, describe fabrics, trendy cuts, stylish wardrobe choices.
5. For grocery/kirana, describe crisp farm produce, daily essentials, pantry staples, and neighborhood savings.
6. For electronics/tech, describe modern gadget features, crisp displays, speed, durability.
7. NEVER invent generic corporate offices or unrelated scenes. Keep it 100% true to {biz_name} ({biz_type}).

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
        return _demo_video_storyboard(req, biz_name, biz_type, catalog=catalog, location=location, currency=currency)

    try:
        raw_clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(raw_clean)
        # Attach preview image links to scenes matching the actual business type
        search_key = f"{biz_type} {product_name}"
        for i, sc in enumerate(data.get("scenes", [])):
            sc["preview_image"] = _pick_stock_image(search_key, i)
        return data
    except Exception as e:
        logger.warning("Failed to parse LLM video storyboard response: %s. Using demo format.", e)
        return _demo_video_storyboard(req, biz_name, biz_type, catalog=catalog, location=location, currency=currency)


def _demo_video_storyboard(req: dict, biz_name: str, biz_type: str, catalog: list = None, location: str = "", currency: str = "INR") -> dict:
    catalog_names = [p["name"] for p in (catalog or []) if isinstance(p, dict) and p.get("name")]
    default_product = catalog_names[0] if catalog_names else "Signature Collection"
    product = (req.get("product_name") or default_product)
    duration = int(req.get("duration_seconds") or 15)
    aspect_ratio = req.get("aspect_ratio") or "9:16"
    platform = req.get("target_platform") or "instagram_reels"
    search_key = f"{biz_type} {product}"
    loc_str = f" in {location}" if location else ""
    bt = (biz_type or "").lower()

    if any(k in bt for k in ["bakery", "cake", "sweet", "pastry"]):
        scenes = [
            {
                "scene_number": 1,
                "duration": 3,
                "phase": "Scroll-Stopping Hook",
                "visual_description": f"Golden oven doors open revealing warm, rising {product} with gentle steam and buttery glaze.",
                "on_screen_text": f"Oven fresh at {biz_name}! 🥐✨",
                "voiceover": f"Stop scrolling! Can you smell the fresh butter and warm crust from {biz_name}?",
                "camera_motion": "Fast push-in with macro lens depth of field",
                "sound_fx": "Crisp pastry crackle + gentle oven chime",
                "preview_image": _pick_stock_image(search_key, 0),
                "transition": "Whip pan right"
            },
            {
                "scene_number": 2,
                "duration": 4,
                "phase": "Craftsmanship & Quality",
                "visual_description": f"Baker gently dusting powdered sugar and slicing into artisan {product} showing soft airy layers.",
                "on_screen_text": "Baked fresh every single morning 🍞",
                "voiceover": "No preservatives, no shortcuts. Just 100% handmade passion baked fresh before sunrise.",
                "camera_motion": "Smooth slow-motion 60fps tracking shot",
                "sound_fx": "Rhythmic upbeat lo-fi acoustic beat",
                "preview_image": _pick_stock_image(search_key, 1),
                "transition": "Flash dissolve"
            },
            {
                "scene_number": 3,
                "duration": 5,
                "phase": "Hero Product Showcase",
                "visual_description": f"Rotating showcase table displaying {product} alongside gourmet pastries and hot espresso.",
                "on_screen_text": f"Your daily treat awaits at {biz_name} ☕",
                "voiceover": f"Whether it's your morning breakfast run or weekend celebration, {product} is made to bring pure joy.",
                "camera_motion": "360-degree smooth orbit",
                "sound_fx": "Warm bell chime and uplifting melody",
                "preview_image": _pick_stock_image(search_key, 2),
                "transition": "Zoom out"
            },
            {
                "scene_number": 4,
                "duration": 3,
                "phase": "Call to Action",
                "visual_description": f"Branded end-card with {biz_name} bakery logo{loc_str} and fresh batch timer.",
                "on_screen_text": f"🔥 Visit {biz_name}{loc_str} today!",
                "voiceover": f"Drop by {biz_name}{loc_str} today before today's fresh batch sells out!",
                "camera_motion": "Hero center lock-off",
                "sound_fx": "Crisp register chime + happy tap",
                "preview_image": _pick_stock_image(search_key, 0),
                "transition": "Fade to brand logo"
            }
        ]
    elif any(k in bt for k in ["restaurant", "food", "cafe", "dining"]):
        scenes = [
            {
                "scene_number": 1,
                "duration": 3,
                "phase": "Flavor Hook",
                "visual_description": f"Chef tossing sizzling {product} in a flaming wok with aromatic spices rising in golden light.",
                "on_screen_text": f"Craving something unforgettable? 🍽️🔥",
                "voiceover": f"Stop scrolling if you love great food! Have you tried the famous {product} at {biz_name}?",
                "camera_motion": "Dynamic snap-zoom into the sizzling pan",
                "sound_fx": "Sizzle drop + bass whoosh",
                "preview_image": _pick_stock_image(search_key, 0),
                "transition": "Whip pan"
            },
            {
                "scene_number": 2,
                "duration": 4,
                "phase": "Authentic Ingredients",
                "visual_description": f"Fresh herbs, handpicked spices, and rich sauces being expertly drizzled onto {product}.",
                "on_screen_text": "Farm-fresh ingredients • Secret family recipe",
                "voiceover": "We believe great taste starts with real, honest ingredients. Cooked to mouthwatering perfection.",
                "camera_motion": "Top-down macro slider",
                "sound_fx": "Upbeat culinary beat drop",
                "preview_image": _pick_stock_image(search_key, 1),
                "transition": "Smooth dissolve"
            },
            {
                "scene_number": 3,
                "duration": 5,
                "phase": "Dining Experience",
                "visual_description": f"Beautifully plated table in cozy warm ambient lighting surrounded by happy dining guests.",
                "on_screen_text": f"Best rated comfort dining in {location or 'town'} ⭐⭐⭐⭐⭐",
                "voiceover": f"Every bite of our signature {product} delivers rich, authentic flavors that keep customers coming back.",
                "camera_motion": "Slow orbit tracking table setting",
                "sound_fx": "Uplifting crescendo melody",
                "preview_image": _pick_stock_image(search_key, 2),
                "transition": "Zoom in"
            },
            {
                "scene_number": 4,
                "duration": 3,
                "phase": "Call to Action",
                "visual_description": f"End card showing {biz_name} storefront, table reservation link, and takeout promo tag.",
                "on_screen_text": "Reserve your table or order now! 🛵",
                "voiceover": f"Dine in or order from {biz_name}{loc_str} today. Your table is ready!",
                "camera_motion": "Static punchy hero lock-off",
                "sound_fx": "Digital chime",
                "preview_image": _pick_stock_image(search_key, 0),
                "transition": "Fade to brand logo"
            }
        ]
    elif any(k in bt for k in ["grocery", "kirana", "supermarket", "provision"]):
        scenes = [
            {
                "scene_number": 1,
                "duration": 3,
                "phase": "Savings Hook",
                "visual_description": f"Bright supermarket aisles filled with colorful fresh produce and neatly organized {product}.",
                "on_screen_text": "Why pay more for daily groceries? 🛒",
                "voiceover": f"Wait! Stop overpaying for your monthly provisions. Check out what's in store at {biz_name}!",
                "camera_motion": "Fast push-in down store aisle",
                "sound_fx": "Cash register ding + bright chime",
                "preview_image": _pick_stock_image(search_key, 0),
                "transition": "Whip pan"
            },
            {
                "scene_number": 2,
                "duration": 4,
                "phase": "Freshness & Quality",
                "visual_description": f"Macro shot of crisp farm-fresh produce and premium branded staples being packed with care.",
                "on_screen_text": "100% Farm-Fresh Quality Guaranteed 🌿",
                "voiceover": f"From premium {product} to your daily kitchen essentials, we guarantee top quality at honest prices.",
                "camera_motion": "Horizontal slider across fresh displays",
                "sound_fx": "Snappy percussion build up",
                "preview_image": _pick_stock_image(search_key, 1),
                "transition": "Flash dissolve"
            },
            {
                "scene_number": 3,
                "duration": 5,
                "phase": "Mega Family Savings",
                "visual_description": f"A full grocery basket packed with essentials, displaying special discount vouchers and smiles.",
                "on_screen_text": f"Big savings on every bill at {biz_name} 💰",
                "voiceover": "Enjoy wholesale prices, seasonal discounts, and friendly neighbourhood service every day.",
                "camera_motion": "Slow tilt-up shot of packed shopping basket",
                "sound_fx": "Uplifting warm synth drop",
                "preview_image": _pick_stock_image(search_key, 2),
                "transition": "Zoom out"
            },
            {
                "scene_number": 4,
                "duration": 3,
                "phase": "Call to Action",
                "visual_description": f"Store address {biz_name}{loc_str} with free home delivery banner.",
                "on_screen_text": "Shop in-store or WhatsApp your list today! 🚚",
                "voiceover": f"Visit {biz_name}{loc_str} today or WhatsApp your order for lightning fast delivery!",
                "camera_motion": "Static branded lock-off",
                "sound_fx": "Positive bell ding",
                "preview_image": _pick_stock_image(search_key, 0),
                "transition": "Fade to brand logo"
            }
        ]
    elif any(k in bt for k in ["fashion", "clothing", "boutique", "apparel"]):
        scenes = [
            {
                "scene_number": 1,
                "duration": 3,
                "phase": "Style Hook",
                "visual_description": f"Stylish model stepping forward wearing elegant {product} in chic modern studio lighting.",
                "on_screen_text": f"New Season Drop at {biz_name}! ✨👗",
                "voiceover": f"Looking for that head-turning look this weekend? {biz_name} just dropped brand new arrivals!",
                "camera_motion": "Fast push-in with lens flare",
                "sound_fx": "Fashion runway bass drop",
                "preview_image": _pick_stock_image(search_key, 0),
                "transition": "Whip pan"
            },
            {
                "scene_number": 2,
                "duration": 4,
                "phase": "Fabric & Fit",
                "visual_description": f"Macro camera gliding over luxurious fabric textures, fine stitching, and premium finishing of {product}.",
                "on_screen_text": "Premium Fabrics • Flattering Silhouettes",
                "voiceover": "Bespoke tailoring, breathable fabrics, and trending colors crafted to keep you confident all day.",
                "camera_motion": "Slow macro tracking across seams",
                "sound_fx": "Rhythmic modern beat",
                "preview_image": _pick_stock_image(search_key, 1),
                "transition": "Flash cut"
            },
            {
                "scene_number": 3,
                "duration": 5,
                "phase": "Collection Showcase",
                "visual_description": f"Dynamic fashion montage showing different styling options for {product} from day to evening.",
                "on_screen_text": f"Limited edition styles • Exclusively at {biz_name}",
                "voiceover": f"From casual elegance to festive glamour, find your unique personal style with {biz_name}.",
                "camera_motion": "Fast dynamic gimbal cuts",
                "sound_fx": "Deep synth drop and chime",
                "preview_image": _pick_stock_image(search_key, 2),
                "transition": "Zoom in"
            },
            {
                "scene_number": 4,
                "duration": 3,
                "phase": "Call to Action",
                "visual_description": f"End frame with {biz_name} boutique logo, discount badge, and shop link.",
                "on_screen_text": "Shop new arrivals in-store or tap link in bio! 🛍️",
                "voiceover": f"Visit {biz_name}{loc_str} today or tap link in bio before sizes sell out!",
                "camera_motion": "Hero static lock-off",
                "sound_fx": "Crisp notification chime",
                "preview_image": _pick_stock_image(search_key, 0),
                "transition": "Fade to brand logo"
            }
        ]
    else:
        scenes = [
            {
                "scene_number": 1,
                "duration": 3,
                "phase": "Scroll-Stopping Hook",
                "visual_description": f"Dynamic macro zoom into {product} with cinematic lighting and reflections.",
                "on_screen_text": f"Discover what's new at {biz_name}! 👀",
                "voiceover": f"Stop scrolling! If you haven't checked out {biz_name}{loc_str} yet, you're missing out.",
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
                "voiceover": f"No more compromises. We brought together top-tier quality and unbeatable value with {product}.",
                "camera_motion": "Smooth horizontal slider tracking across product",
                "sound_fx": "Rhythmic high-hat build up",
                "preview_image": _pick_stock_image(search_key, 1),
                "transition": "Flash dissolve"
            },
            {
                "scene_number": 3,
                "duration": 5,
                "phase": "Product Showcase",
                "visual_description": f"Satisfying 360-degree orbit shot showcasing texture and craftsmanship of {product}.",
                "on_screen_text": f"Crafted with perfection 🌟 Top rated by locals",
                "voiceover": f"Every single detail is designed for your satisfaction, backed by trusted local service.",
                "camera_motion": "Slow motion 60fps rotating orbit",
                "sound_fx": "Subtle bell chime & uplifting melodic drop",
                "preview_image": _pick_stock_image(search_key, 2),
                "transition": "Zoom out"
            },
            {
                "scene_number": 4,
                "duration": 3,
                "phase": "Irresistible Call to Action",
                "visual_description": f"Bold branded end-screen featuring {biz_name} logo{loc_str} and promo tag.",
                "on_screen_text": "🔥 Limited Time Offer! Visit us today",
                "voiceover": f"Visit {biz_name}{loc_str} today or tap the link in bio to claim your special offer!",
                "camera_motion": "Static punchy hero lock-off",
                "sound_fx": "Crisp digital chime + applause tap",
                "preview_image": _pick_stock_image(search_key, 0),
                "transition": "Fade to brand logo"
            }
        ]

    return {
        "title": f"{biz_name} - {product} Promo Reel",
        "concept": f"Authentic commercial showcasing {product} tailored specifically for {biz_name}'s {biz_type} customers{loc_str}.",
        "hook_headline": f"Why everyone in {location or 'town'} is talking about {biz_name}!",
        "duration_seconds": duration,
        "aspect_ratio": aspect_ratio,
        "platform": platform,
        "music_track": {
            "title": "Neon Rush (Lo-Fi Modern Beat)",
            "vibe": "Energetic, modern beat, warm local rhythm",
            "bpm": 124
        },
        "full_voiceover_script": " ".join([sc["voiceover"] for sc in scenes]),
        "scenes": scenes,
        "veo_generation_prompt": f"A cinematic commercial 9:16 vertical video for {biz_name}, a {biz_type} business{loc_str}, featuring {product}. Fast camera moves, warm authentic lighting, commercial grade aesthetic.",
        "hashtags": [
            f"#{biz_name.replace(' ', '').lower()}",
            f"#{biz_type.replace(' ', '').lower()}",
            f"#{location.replace(' ', '').lower()}" if location else "#shoplocal",
            "#reelsviral",
            "#trendingnow",
            "#smallbusinesscheck"
        ]
    }



