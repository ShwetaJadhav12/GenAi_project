"""Test what-if simulation end-to-end — writes to test_whatif_result.txt"""
import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

results = []
log = results.append

try:
    from dotenv import load_dotenv
    load_dotenv('../.env')

    from database import SessionLocal, create_tables
    create_tables()
    db = SessionLocal()

    from models import Business
    from services import analytics as svc
    from services.ai_service import explain_whatif

    biz = db.query(Business).first()
    log(f"Business: {biz.business_name} (id={biz.id})")

    summary = svc.get_summary(db, biz.id, 30)
    log(f"Revenue: {summary['total_revenue']}")
    log(f"Expenses: {summary['total_expenses']}")

    # Simulate price_change scenario
    current_value = 100.0
    new_value = 110.0
    current_revenue = summary['total_revenue']

    price_ratio = new_value / current_value
    estimated_new_revenue = current_revenue * price_ratio
    change = estimated_new_revenue - current_revenue
    change_pct = (change / current_revenue * 100) if current_revenue else 0

    scenario_data = {
        "scenario_description": f"Changing price from {current_value} to {new_value} (+10%) — assuming demand stays constant.",
        "estimated_current": round(current_revenue, 2),
        "estimated_new": round(estimated_new_revenue, 2),
        "estimated_change": round(change, 2),
        "estimated_change_pct": round(change_pct, 2),
        "period_days": 30,
        "business_name": biz.business_name,
    }

    log(f"Scenario: {scenario_data['scenario_description']}")
    log(f"Estimated current: {scenario_data['estimated_current']}")
    log(f"Estimated new: {scenario_data['estimated_new']}")
    log(f"Change %: {scenario_data['estimated_change_pct']}")

    log("Calling explain_whatif (AI)...")
    explanation = explain_whatif(scenario_data)
    log(f"AI Explanation: {explanation[:200]}")

    db.close()
    log("WHATIF TEST PASSED")

except Exception as e:
    import traceback
    log(f"EXCEPTION: {type(e).__name__}: {e}")
    log(traceback.format_exc())

with open("test_whatif_result.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(results))
print("Done — see test_whatif_result.txt")
