"""
Sales Forecasting Service
Uses Scikit-learn Linear Regression (simple, explainable) to predict next 7 days.
Falls back gracefully when data is insufficient.
"""
import os
# Fix OpenBLAS memory allocation errors on Windows with Python 3.14
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")

from datetime import date, timedelta
from typing import List, Dict
import numpy as np

MIN_DATA_POINTS = 14   # require at least 2 weeks of data


def _date_features(d: date) -> List[float]:
    return [d.day, d.month, d.weekday(), d.timetuple().tm_yday]


def build_forecast(daily_sales: List[Dict]) -> dict:
    """
    daily_sales: list of {"date": "YYYY-MM-DD", "amount": float}
    Returns a forecast dict compatible with ForecastResult schema.
    """
    if len(daily_sales) < MIN_DATA_POINTS:
        return {
            "has_forecast": False,
            "message": (
                f"Not enough historical data for reliable forecasting. "
                f"You have {len(daily_sales)} day(s) of sales data; "
                f"at least {MIN_DATA_POINTS} days are required. "
                "Continue adding sales records."
            ),
            "historical": daily_sales,
            "forecast": [],
            "mae": None,
            "rmse": None,
        }

    # ── prepare dataset ──
    from sklearn.linear_model import LinearRegression
    from sklearn.metrics import mean_absolute_error, mean_squared_error

    dates_parsed = [date.fromisoformat(r["date"]) for r in daily_sales]
    amounts = [r["amount"] for r in daily_sales]

    X = np.array([_date_features(d) for d in dates_parsed])
    y = np.array(amounts)

    # train on all data, evaluate with last 7 points as holdout
    split = max(len(X) - 7, MIN_DATA_POINTS - 7)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    model = LinearRegression()
    model.fit(X_train, y_train)

    # evaluation
    if len(X_test) > 0:
        y_pred_test = model.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred_test))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_test)))
    else:
        model.fit(X, y)   # retrain on all
        mae, rmse = None, None

    # retrain on full data for forecasting
    model.fit(X, y)

    # ── forecast next 7 days ──
    last_date = max(dates_parsed)
    forecast = []
    for i in range(1, 8):
        fut_date = last_date + timedelta(days=i)
        feat = np.array([_date_features(fut_date)])
        pred = float(model.predict(feat)[0])
        pred = max(0.0, pred)          # sales can't be negative
        forecast.append({"date": str(fut_date), "predicted_amount": round(pred, 2)})

    return {
        "has_forecast": True,
        "message": "Forecast generated using Linear Regression on historical sales data.",
        "historical": daily_sales,
        "forecast": forecast,
        "mae": round(mae, 2) if mae is not None else None,
        "rmse": round(rmse, 2) if rmse is not None else None,
    }
