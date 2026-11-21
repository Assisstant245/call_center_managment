"""Prophet-based call-volume forecasting for one skill + channel."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Iterable

import numpy as np
import pandas as pd

from .erlang import required_agents

logging.getLogger("prophet").setLevel(logging.WARNING)
logging.getLogger("cmdstanpy").setLevel(logging.WARNING)

INTERVAL = timedelta(minutes=30)
MIN_ROWS = 48


def _prepare(history: Iterable[dict]) -> pd.DataFrame:
    df = pd.DataFrame(list(history))
    if df.empty or not {"ds", "y"} <= set(df.columns):
        raise ValueError("history must contain 'ds' and 'y' columns")
    df["ds"] = pd.to_datetime(df["ds"], utc=True).dt.tz_localize(None)
    df["y"] = pd.to_numeric(df["y"], errors="coerce")
    df = df.dropna(subset=["ds", "y"]).sort_values("ds")
    df = df.drop_duplicates("ds", keep="last").reset_index(drop=True)
    cols = ["ds", "y"] + (["aht"] if "aht" in df.columns else [])
    return df[cols]


def operating_slots(df: pd.DataFrame) -> set[str]:
    """Times of day (HH:MM) seen in history = opening hours."""
    return set(df["ds"].dt.strftime("%H:%M"))


def future_intervals(
    df: pd.DataFrame, count: int, start: datetime | None = None
) -> list[pd.Timestamp]:
    """Next ``count`` 30-minute intervals that fall inside historical opening hours."""
    slots = operating_slots(df)
    if start is not None:
        cursor = pd.Timestamp(start)
        if cursor.tzinfo is not None:
            cursor = cursor.tz_convert("UTC").tz_localize(None)
    else:
        cursor = df["ds"].max() + INTERVAL

    out: list[pd.Timestamp] = []
    guard = 0
    while len(out) < count and guard < count * 60 + 1000:
        if cursor.strftime("%H:%M") in slots:
            out.append(cursor)
        cursor += INTERVAL
        guard += 1
    return out


def _fit(train: pd.DataFrame):
    from prophet import Prophet  # lazy: slow import

    model = Prophet(
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=False,
        interval_width=0.8,
    )
    model.fit(train[["ds", "y"]])
    return model


def evaluate(df: pd.DataFrame) -> dict:
    """Hold out the last 20% of history and report MAE / MAPE."""
    split = int(len(df) * 0.8)
    train, test = df.iloc[:split], df.iloc[split:]
    if len(train) < MIN_ROWS or test.empty:
        return {"mae": None, "mape": None}

    pred = _fit(train).predict(test[["ds"]])["yhat"].clip(lower=0).to_numpy()
    actual = test["y"].to_numpy(dtype=float)
    mae = float(np.mean(np.abs(actual - pred)))
    mask = actual != 0
    mape = (
        float(np.mean(np.abs(actual[mask] - pred[mask]) / actual[mask]) * 100)
        if mask.any()
        else 0.0
    )
    return {"mae": round(mae, 2), "mape": round(mape, 2)}


def forecast(
    history: Iterable[dict],
    channel: str,
    intervals: int = 29,
    start: datetime | None = None,
    aht_sec: float | None = None,
    with_accuracy: bool = True,
) -> dict:
    df = _prepare(history)
    if len(df) < MIN_ROWS:
        raise ValueError(
            f"Not enough history: need at least {MIN_ROWS} rows, got {len(df)}"
        )

    if aht_sec is None:
        aht_sec = float(df["aht"].mean()) if "aht" in df.columns else 300.0

    model = _fit(df)
    future = pd.DataFrame({"ds": future_intervals(df, intervals, start)})
    pred = model.predict(future)

    rows = []
    for ds, yhat, lo, hi in zip(
        pred["ds"], pred["yhat"], pred["yhat_lower"], pred["yhat_upper"]
    ):
        calls = max(0.0, float(yhat))
        rows.append(
            {
                "intervalStart": ds.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
                "intervalEnd": (ds + INTERVAL).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
                "forecastCalls": int(round(calls)),
                "forecastLower": int(round(max(0.0, float(lo)))),
                "forecastUpper": int(round(max(0.0, float(hi)))),
                "requiredAgents": required_agents(calls, aht_sec, channel),
            }
        )

    return {
        "channel": channel,
        "ahtSec": round(aht_sec, 1),
        "accuracy": evaluate(df) if with_accuracy else None,
        "rows": rows,
    }
