"""Erlang-C staffing calculations.

Voice and chat use Erlang C against a service-level target. Chat can handle
several conversations at once (``concurrency``). E-mail has no live
service-level, so it is sized on workload with a maximum occupancy.
"""
from __future__ import annotations

import math

INTERVAL_SECONDS = 30 * 60

# Per channel: service-level target, answer-within seconds,
# concurrency (contacts handled at once) and max occupancy.
CHANNEL_RULES = {
    "Voice": {"sl": 0.80, "answer_sec": 20, "concurrency": 1, "max_occupancy": 0.85},
    "Chat": {"sl": 0.80, "answer_sec": 30, "concurrency": 2, "max_occupancy": 0.90},
    "Email": {"sl": None, "answer_sec": None, "concurrency": 1, "max_occupancy": 0.90},
}


def erlang_c(agents: int, traffic: float) -> float:
    """Probability that an arriving contact has to wait (Erlang C)."""
    if agents <= traffic:
        return 1.0
    # Iterative Erlang-B avoids huge factorials.
    inv_b = 1.0
    for k in range(1, agents + 1):
        inv_b = 1.0 + inv_b * k / traffic
    erlang_b = 1.0 / inv_b
    rho = traffic / agents
    return erlang_b / (1.0 - rho * (1.0 - erlang_b))


def service_level(agents: int, traffic: float, aht_sec: float, answer_sec: float) -> float:
    if traffic <= 0:
        return 1.0
    if agents <= traffic:
        return 0.0
    pw = erlang_c(agents, traffic)
    return 1.0 - pw * math.exp(-(agents - traffic) * answer_sec / aht_sec)


def required_agents(
    calls: float,
    aht_sec: float,
    channel: str = "Voice",
    interval_sec: int = INTERVAL_SECONDS,
) -> int:
    """Agents needed in one interval to meet the channel's service target."""
    if calls <= 0 or aht_sec <= 0:
        return 0

    rules = CHANNEL_RULES.get(channel, CHANNEL_RULES["Voice"])
    effective_aht = aht_sec / rules["concurrency"]
    traffic = calls * effective_aht / interval_sec  # Erlangs
    minimum = max(1, math.ceil(traffic / rules["max_occupancy"]))

    if rules["sl"] is None:
        return minimum

    agents = max(minimum, math.floor(traffic) + 1)
    while service_level(agents, traffic, effective_aht, rules["answer_sec"]) < rules["sl"]:
        agents += 1
        if agents > 10_000:  # safety net
            break
    return max(agents, minimum)
