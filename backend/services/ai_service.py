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
