# AI Small-Business Operations Assistant

A complete, locally-runnable AI-powered operations platform for small businesses.
Capstone project built with React, FastAPI, SQLite, scikit-learn, Tesseract OCR, and Gemini/OpenAI.

---

## Features

| Feature | Description |
|---|---|
| Multi-source data input | CSV/Excel upload, OCR image scan, natural language text |
| Dashboard | KPI cards, trend charts, category breakdown, low-stock alerts |
| AI Insights | Analytics engine computes metrics → LLM explains them |
| Sales Forecasting | Linear Regression model, 7-day prediction, MAE/RMSE evaluation |
| What-If Simulator | Estimate impact of price or expense changes |
| Ask AI | Chat interface backed by real business data |
| Action Plan | Prioritised weekly recommendations from verified data |
| Business Report | Full report with AI insights + forecast, printable as PDF |
| Demo Data | One-click grocery and clothing datasets (90 days) |
| Business types | Grocery, Clothing, Restaurant, Retail, Other |

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- (Optional) Tesseract OCR for image scanning

---

### 1. Clone / extract the project

```
ai-business-assistant/
├── backend/
├── frontend/
├── data/
├── .env.example
└── README.md
```

---

### 2. Configure environment

```bash
# From the project root
copy .env.example .env        # Windows
# or
cp .env.example .env          # macOS/Linux
```

Edit `.env`:

```env
LLM_PROVIDER=gemini           # or openai
LLM_API_KEY=your_key_here     # leave blank for demo mode
SECRET_KEY=change_this_secret
TESSERACT_CMD=                # path to tesseract.exe on Windows if not in PATH
```

> **Demo mode**: If `LLM_API_KEY` is left blank, the app runs with mock AI responses.
> All other features (dashboard, analytics, forecasting, data input) work fully without an API key.

---

### 3. Backend setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend starts at **http://127.0.0.1:8000**  
API docs: **http://127.0.0.1:8000/docs**

---

### 4. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at **http://localhost:5173**

---

### 5. First run walkthrough

1. Open http://localhost:5173
2. Click **Get Started** → Create an account
3. Go to **Business Setup** → Create a business (e.g. "My Grocery Store" / Grocery / INR)
4. Click **Load Grocery Demo** to populate 90 days of realistic data
5. Navigate to **Dashboard** — all KPIs, charts, and alerts populate from the database
6. Go to **AI Insights** → click **Generate Insights**
7. Go to **Forecast** → click **Run Forecast** (7-day ML prediction)
8. Go to **What-If Simulator** → run a price/expense scenario
9. Go to **Ask AI** → ask "Why did my profit decrease?"
10. Go to **Reports** → click **Generate Report** → **Print / PDF**

---

## Demo Credentials

After registering your own account, use the **Business Setup** page to load demo data.

Or use these pre-created demo credentials if you seed them manually:

| Field | Value |
|---|---|
| Email | demo@example.com |
| Password | demo1234 |

> To create this account, simply register with these credentials on first run.

---

## Project Structure

```
ai-business-assistant/
│
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── database.py              # SQLAlchemy engine + session
│   ├── models.py                # ORM models (User, Business, Product, Transaction, Expense)
│   ├── schemas.py               # Pydantic schemas
│   ├── requirements.txt
│   │
│   ├── routes/
│   │   ├── auth.py              # Register, login, token
│   │   ├── businesses.py        # Business CRUD + demo loader
│   │   ├── products.py          # Product/inventory CRUD
│   │   ├── transactions.py      # Transaction CRUD
│   │   ├── expenses.py          # Expense CRUD
│   │   ├── analytics.py         # Dashboard + metric endpoints
│   │   ├── ai_routes.py         # Insights, chat, what-if, action plan
│   │   ├── forecast.py          # ML forecast endpoint
│   │   ├── data_input.py        # CSV upload, OCR, NLP confirm
│   │   └── reports.py           # Full report endpoint
│   │
│   └── services/
│       ├── analytics.py         # All numerical metric calculations
│       ├── ai_service.py        # LLM integration (Gemini/OpenAI/demo)
│       ├── ocr_service.py       # Tesseract OCR (swappable)
│       ├── forecast.py          # scikit-learn Linear Regression model
│       ├── data_import.py       # CSV/Excel parsing + DB import
│       └── demo_loader.py       # Sample data generator
│
├── frontend/
│   ├── src/
│   │   ├── pages/               # One file per page
│   │   ├── components/          # Shared UI components
│   │   ├── context/             # AuthContext, BusinessContext
│   │   ├── services/api.js      # Axios instance
│   │   └── App.jsx              # Router + layout
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── data/
│   ├── grocery_demo.csv         # Sample grocery data
│   └── clothing_demo.csv        # Sample clothing data
│
├── .env.example
└── README.md
```

---

## Supported Business Types

The system is business-agnostic. The same schema supports all types:

- **Grocery** — products with units (kg/litre/packet), high-frequency sales
- **Clothing** — products with size/color fields
- **Restaurant** — food items, daily revenue tracking
- **Retail** — general products, inventory management
- **Other** — any small business

---

## AI Design Principles

The system follows a strict data-first AI architecture:

```
Database → Analytics Engine → Verified Metrics → LLM → Explanation
```

- The **analytics engine** (Python) computes all numbers
- The **LLM** only receives pre-computed facts and explains them
- The LLM **never** invents numerical values
- If data is missing, the system says so explicitly

---

## Data-Sufficiency Handling

The application recognises when data is insufficient and displays clear messages:

- **< 14 days sales data** → "Not enough data for reliable forecasting"
- **No expenses added** → "Expense analysis unavailable"
- **No inventory data** → "Inventory recommendations require inventory information"

---

## Tesseract OCR Installation

### Windows
1. Download from https://github.com/UB-Mannheim/tesseract/wiki
2. Install (default path: `C:\Program Files\Tesseract-OCR\`)
3. Add to `.env`: `TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe`

### macOS
```bash
brew install tesseract
```

### Ubuntu/Debian
```bash
sudo apt install tesseract-ocr
```

---

## Getting LLM API Keys

### Gemini (recommended — free tier available)
1. Go to https://makersuite.google.com/app/apikey
2. Create an API key
3. Set in `.env`: `LLM_PROVIDER=gemini` and `LLM_API_KEY=your_key`

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create an API key
3. Set in `.env`: `LLM_PROVIDER=openai` and `LLM_API_KEY=your_key`

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Axios |
| Backend | Python FastAPI, Uvicorn |
| Database | SQLite (via SQLAlchemy) |
| Data processing | Pandas, NumPy |
| Machine learning | scikit-learn (Linear Regression) |
| OCR | Tesseract (pytesseract) |
| AI / LLM | Google Gemini 1.5 Flash / OpenAI GPT-3.5 |
| Auth | Custom PBKDF2 token auth (no external JWT lib) |

---

## Common Issues

**Backend won't start**
```bash
# Ensure you are in the backend/ directory
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**CORS error in browser**
- Ensure the backend is running on port 8000
- Vite proxy in `vite.config.js` forwards `/api` to `127.0.0.1:8000`

**OCR returns no text**
- Ensure Tesseract is installed and `TESSERACT_CMD` is set in `.env`
- Use a clear, well-lit image with legible text

**AI returns "Demo Mode" responses**
- Add your `LLM_API_KEY` to `.env` and restart the backend

**Forecast says "not enough data"**
- Load demo data or add at least 14 days of sales transactions

---

*AI Business Assistant — Capstone Project*
