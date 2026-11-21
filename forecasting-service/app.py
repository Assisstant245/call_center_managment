"""Forecasting / staffing / scheduling microservice (FastAPI).

Run:  uvicorn app:app --port 8000
"""
from __future__ import annotations

import os
from datetime import datetime
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from model import engine
from model.erlang import required_agents
from model.optimizer import optimize

app = FastAPI(title="Workforce Forecasting Service", version="1.0.0")


def check_key(x_api_key: Optional[str] = Header(default=None)):
    expected = os.getenv("FORECAST_API_KEY")
    if expected and x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid API key")


class HistoryPoint(BaseModel):
    ds: datetime
    y: float
    aht: Optional[float] = None


class ForecastRequest(BaseModel):
    channel: str = "Voice"
    history: list[HistoryPoint]
    intervals: int = Field(default=29, ge=1, le=2000)
    start: Optional[datetime] = None
    ahtSec: Optional[float] = Field(default=None, gt=0)
    withAccuracy: bool = True


class StaffingRequest(BaseModel):
    calls: float = Field(ge=0)
    ahtSec: float = Field(gt=0)
    channel: str = "Voice"


class Slot(BaseModel):
    id: str
    skillId: int
    start: int  # epoch milliseconds
    required: int = Field(ge=0)


class AgentIn(BaseModel):
    id: int
    skillIds: list[int]
    availableStarts: list[int]
    busyStarts: list[int] = []


class OptimizeRequest(BaseModel):
    slots: list[Slot]
    agents: list[AgentIn]
    timeLimitSec: float = Field(default=10.0, gt=0, le=60)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/forecast", dependencies=[Depends(check_key)])
def forecast(req: ForecastRequest):
    try:
        return engine.forecast(
            [h.model_dump() for h in req.history],
            channel=req.channel,
            intervals=req.intervals,
            start=req.start,
            aht_sec=req.ahtSec,
            with_accuracy=req.withAccuracy,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@app.post("/staffing", dependencies=[Depends(check_key)])
def staffing(req: StaffingRequest):
    return {"requiredAgents": required_agents(req.calls, req.ahtSec, req.channel)}


@app.post("/schedule/optimize", dependencies=[Depends(check_key)])
def schedule_optimize(req: OptimizeRequest):
    return optimize(
        [s.model_dump() for s in req.slots],
        [a.model_dump() for a in req.agents],
        req.timeLimitSec,
    )
