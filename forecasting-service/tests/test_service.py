import math

from fastapi.testclient import TestClient

from app import app
from model.erlang import erlang_c, required_agents, service_level
from model.optimizer import optimize

client = TestClient(app)


# ---------------------------------------------------------------- Erlang C
def test_erlang_c_overloaded_always_waits():
    assert erlang_c(5, 10) == 1.0


def test_erlang_c_reasonable_probability():
    assert 0.2 < erlang_c(12, 10) < 0.6


def test_required_agents_meets_service_level_exactly():
    calls, aht = 120, 300
    traffic = calls * aht / 1800
    n = required_agents(calls, aht, "Voice")
    assert n > traffic
    assert service_level(n, traffic, aht, 20) >= 0.8
    assert service_level(n - 1, traffic, aht, 20) < 0.8 or n - 1 < math.ceil(traffic / 0.85)


def test_zero_calls_need_nobody():
    assert required_agents(0, 300, "Voice") == 0


def test_chat_needs_fewer_agents_than_voice():
    assert required_agents(100, 400, "Chat") < required_agents(100, 400, "Voice")


def test_email_is_workload_based():
    # 60 emails x 600s = 20 Erlangs; /0.9 occupancy -> 23 agents
    assert required_agents(60, 600, "Email") == 23


# -------------------------------------------------------------- Optimiser
def _agent(i, skills, starts):
    return {"id": i, "skillIds": skills, "availableStarts": starts}


def test_optimizer_covers_demand_and_never_double_books():
    slots = [
        {"id": "a", "skillId": 1, "start": 1000, "required": 2},
        {"id": "b", "skillId": 2, "start": 1000, "required": 1},
    ]
    agents = [
        _agent(1, [1], [1000]),
        _agent(2, [1, 2], [1000]),
        _agent(3, [1], [1000]),
    ]
    res = optimize(slots, agents, 5)
    assert res["coverage"] == 1
    per_agent = [a["agentId"] for a in res["assignments"]]
    assert len(per_agent) == len(set(per_agent))  # one slot per agent per start
    # only agent 2 has skill 2
    assert {"slotId": "b", "agentId": 2} in res["assignments"]


def test_optimizer_reports_shortfall_when_understaffed():
    slots = [{"id": "a", "skillId": 1, "start": 1000, "required": 3}]
    res = optimize(slots, [_agent(1, [1], [1000])], 5)
    assert res["shortfalls"] == [{"slotId": "a", "missing": 2}]
    assert 0 < res["coverage"] < 1


def test_optimizer_respects_availability():
    slots = [{"id": "a", "skillId": 1, "start": 2000, "required": 1}]
    res = optimize(slots, [_agent(1, [1], [1000])], 5)
    assert res["assignments"] == []


# -------------------------------------------------------------------- API
def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_staffing_endpoint():
    r = client.post("/staffing", json={"calls": 120, "ahtSec": 300, "channel": "Voice"})
    assert r.status_code == 200 and r.json()["requiredAgents"] >= 21


def test_forecast_rejects_short_history():
    r = client.post(
        "/forecast",
        json={"channel": "Voice", "history": [{"ds": "2026-04-01T08:00:00Z", "y": 5}]},
    )
    assert r.status_code == 422
