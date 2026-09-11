"""Quick smoke test — writes results to test_result.txt"""
import sys, os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

results = []
log = results.append

try:
    from dotenv import load_dotenv
    load_dotenv('../.env')
    log("dotenv loaded")

    from database import SessionLocal, create_tables
    create_tables()
    db = SessionLocal()
    log("DB connected")

    from models import Business
    from services import analytics as svc
    from services.ai_service import generate_insights, chat_with_data, DEMO_MODE

    log(f"Demo mode: {DEMO_MODE}")

    biz = db.query(Business).first()
    if not biz:
        log("ERROR: No business in DB")
    else:
        log(f"Business: {biz.business_name}")
        context = svc.build_llm_context(db, biz.id, 30)
        log(f"Revenue: {context['summary']['total_revenue']}")

        log("Calling generate_insights...")
        ins = generate_insights(context, biz.business_name, biz.business_type)
        log(f"INSIGHTS OK - summary: {ins['summary'][:100]}")
        log(f"Action items: {len(ins.get('action_plan', []))}")

        log("Calling chat_with_data...")
        chat = chat_with_data("What are my top selling products?", context, biz.business_name, biz.business_type)
        log(f"CHAT OK - reply: {chat['reply'][:100]}")

    db.close()
    log("ALL TESTS PASSED")

except Exception as e:
    import traceback
    log(f"EXCEPTION: {type(e).__name__}: {e}")
    log(traceback.format_exc())

# Write to file
with open("test_result.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(results))

print("Done — see test_result.txt")
