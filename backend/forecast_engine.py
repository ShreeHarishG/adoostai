"""
AdBoostAI Forecast Engine
=========================
Deterministic financial intelligence module.
Fetches PerformanceSnapshot data from PostgreSQL, computes burn rate via
linear regression, predicts budget exhaustion, and assesses risk levels.

All timestamps are parsed and returned as UTC ISO 8601.
"""

import os
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load DB credentials from .env (never hardcoded)
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set in backend/.env")

engine = create_engine(DATABASE_URL)

# ─── Constants ───────────────────────────────────────────
IMPRESSION_BASELINE = 10_000  # Minimum impressions for statistical significance
LOOKBACK_DAYS = 14            # How far back to fetch snapshots
BURN_RATE_WINDOW = 7          # Days used for average daily spend


def generate_forecast(campaign_id: str) -> dict:
    """
    Main entry point. Returns a structured forecast dict.
    Pure data, no explanatory text.
    """
    # 1. Fetch snapshots + campaign budget
    snapshots_df, total_budget = _fetch_data(campaign_id)

    if snapshots_df.empty:
        return {
            "predictedSpendExhaustionDate": None,
            "projectedBurnRate": None,
            "statisticalConfidenceRisk": "LOW",
            "budgetRiskLevel": "LOW",
            "modelConfidence": "LOW",
        }

    # 2. Compute projected burn rate
    projected_burn_rate = _compute_burn_rate(snapshots_df)

    # 3. Compute exhaustion date
    total_spend = float(snapshots_df["spend"].sum())
    remaining_budget = (total_budget or 0) - total_spend
    predicted_exhaustion_date = _compute_exhaustion_date(
        remaining_budget, projected_burn_rate
    )

    # 4. Days until exhaustion
    if predicted_exhaustion_date:
        days_until = (predicted_exhaustion_date - datetime.now(timezone.utc)).days
    else:
        days_until = 999  # No exhaustion predicted

    # 5. Statistical exposure risk
    statistical_risk = _compute_statistical_risk(snapshots_df, days_until)

    # 6. Budget risk level
    budget_risk = _compute_budget_risk(days_until)

    # 7. Model confidence
    model_confidence = _compute_model_confidence(snapshots_df)

    return {
        "predictedSpendExhaustionDate": (
            predicted_exhaustion_date.isoformat() if predicted_exhaustion_date else None
        ),
        "projectedBurnRate": round(projected_burn_rate, 2),
        "statisticalConfidenceRisk": statistical_risk,
        "budgetRiskLevel": budget_risk,
        "modelConfidence": model_confidence,
    }


# ─── Data Fetching ───────────────────────────────────────


def _fetch_data(campaign_id: str) -> tuple[pd.DataFrame, float | None]:
    """Fetch last 14 days of PerformanceSnapshot + Campaign.totalBudget."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)).isoformat()

    with engine.connect() as conn:
        # Fetch total budget from Campaign
        budget_row = conn.execute(
            text('SELECT "totalBudget" FROM "Campaign" WHERE id = :cid'),
            {"cid": campaign_id},
        ).fetchone()
        total_budget = float(budget_row[0]) if budget_row and budget_row[0] else None

        # Fetch performance snapshots
        rows = conn.execute(
            text(
                """
                SELECT timestamp, ctr, cpa, impressions, spend, clicks, conversions
                FROM "PerformanceSnapshot"
                WHERE "campaignId" = :cid AND timestamp >= :cutoff
                ORDER BY timestamp ASC
                """
            ),
            {"cid": campaign_id, "cutoff": cutoff},
        ).fetchall()

    if not rows:
        return pd.DataFrame(), total_budget

    df = pd.DataFrame(
        rows,
        columns=["timestamp", "ctr", "cpa", "impressions", "spend", "clicks", "conversions"],
    )
    # Strict UTC ISO 8601 parsing
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
    return df, total_budget


# ─── Burn Rate ───────────────────────────────────────────


def _compute_burn_rate(df: pd.DataFrame) -> float:
    """
    Linear regression on daily spend.
    ProjectedBurnRate = mean(last 7 days) + slope adjustment.
    """
    # Aggregate to daily spend
    daily = df.set_index("timestamp").resample("D")["spend"].sum().reset_index()
    daily.columns = ["date", "daily_spend"]
    daily = daily[daily["daily_spend"] > 0]

    if daily.empty:
        return 0.0

    # Day index for regression
    daily["day_index"] = range(len(daily))

    if len(daily) >= 2:
        coeffs = np.polyfit(daily["day_index"].values, daily["daily_spend"].values, 1)
        slope = coeffs[0]
    else:
        slope = 0.0

    # Average of last BURN_RATE_WINDOW days
    recent = daily.tail(BURN_RATE_WINDOW)
    avg_daily_spend = float(recent["daily_spend"].mean())

    # Projected = avg + slope adjustment (slope represents daily change)
    projected = avg_daily_spend + slope
    return max(projected, 0.0)  # Never negative


# ─── Exhaustion Date ─────────────────────────────────────


def _compute_exhaustion_date(
    remaining_budget: float, burn_rate: float
) -> datetime | None:
    """Predict when budget runs out."""
    if burn_rate <= 0 or remaining_budget <= 0:
        return None

    days_until = remaining_budget / burn_rate
    return datetime.now(timezone.utc) + timedelta(days=days_until)


# ─── Statistical Exposure Risk ───────────────────────────


def _compute_statistical_risk(df: pd.DataFrame, days_until: int) -> str:
    """
    HIGH if projected total impressions < baseline AND exhaustion < 5 days.
    """
    total_impressions = int(df["impressions"].sum())
    if total_impressions < IMPRESSION_BASELINE and days_until < 5:
        return "HIGH"
    if total_impressions < IMPRESSION_BASELINE:
        return "MEDIUM"
    return "LOW"


# ─── Budget Risk Level ───────────────────────────────────


def _compute_budget_risk(days_until: int) -> str:
    """Based on days until exhaustion."""
    if days_until <= 3:
        return "HIGH"
    if days_until <= 7:
        return "MEDIUM"
    return "LOW"


# ─── Model Confidence ───────────────────────────────────


def _compute_model_confidence(df: pd.DataFrame) -> str:
    """
    LOW  if fewer than 5 snapshots.
    MEDIUM if spend variance coefficient > 0.5.
    HIGH otherwise.
    """
    if len(df) < 5:
        return "LOW"

    mean_spend = df["spend"].mean()
    if mean_spend > 0:
        cv = float(df["spend"].std() / mean_spend)
        if cv > 0.5:
            return "MEDIUM"

    return "HIGH"
