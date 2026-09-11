"""
AI Small-Business Operations Assistant — FastAPI entry point.
Run with: uvicorn main:app --reload
"""
import os
import sys

# Must be set before numpy/scipy/sklearn are imported to prevent
# OpenBLAS memory allocation errors on Windows
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_MAIN_FREE", "1")

from dotenv import load_dotenv

# Load .env from project root (one level up from backend/)
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import create_tables

# ── import all routers ──
from routes.auth import router as auth_router
from routes.businesses import router as biz_router
from routes.products import router as prod_router
from routes.transactions import router as tx_router
from routes.expenses import router as exp_router
from routes.analytics import router as analytics_router
from routes.ai_routes import router as ai_router
from routes.forecast import router as forecast_router
from routes.data_input import router as data_input_router
from routes.reports import router as reports_router

# ── create tables on startup ──
create_tables()

# ── ensure uploads dir exists ──
os.makedirs(os.path.join(os.path.dirname(__file__), "uploads"), exist_ok=True)

app = FastAPI(
    title="AI Small-Business Operations Assistant",
    description="Capstone project — FastAPI backend powering an AI-driven business dashboard.",
    version="1.0.0",
)

# ── CORS — allow Vite dev server ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── register routers ──
API_PREFIX = "/api"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(biz_router, prefix=API_PREFIX)
app.include_router(prod_router, prefix=API_PREFIX)
app.include_router(tx_router, prefix=API_PREFIX)
app.include_router(exp_router, prefix=API_PREFIX)
app.include_router(analytics_router, prefix=API_PREFIX)
app.include_router(ai_router, prefix=API_PREFIX)
app.include_router(forecast_router, prefix=API_PREFIX)
app.include_router(data_input_router, prefix=API_PREFIX)
app.include_router(reports_router, prefix=API_PREFIX)


@app.get("/")
def root():
    return {
        "message": "AI Small-Business Operations Assistant API",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}
