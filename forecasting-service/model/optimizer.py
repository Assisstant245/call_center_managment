"""Shift-assignment optimiser (OR-Tools CP-SAT).

Problem
-------
* ``slots``  - 30-minute demand slots, each needing ``required`` agents of a
  given skill/channel.
* ``agents`` - agents with skills and the slot start-times they can work
  (inside their shift, not on leave).

Hard rules : an agent covers at most one slot per start-time; an agent needs
             the slot's skill and must be available.
Objective  : 1) minimise uncovered demand, 2) spread work evenly by minimising
             the busiest agent's load.
"""
from __future__ import annotations

from collections import defaultdict


def optimize(slots: list[dict], agents: list[dict], time_limit_sec: float = 10.0) -> dict:
    from ortools.sat.python import cp_model

    model = cp_model.CpModel()

    eligible: dict[int, list[int]] = {}
    x: dict[tuple[int, int], object] = {}
    by_agent_start: dict[tuple[int, int], list] = defaultdict(list)
    agent_vars: dict[int, list] = defaultdict(list)

    avail = [set(a["availableStarts"]) for a in agents]
    busy = [set(a.get("busyStarts", [])) for a in agents]

    for si, slot in enumerate(slots):
        eligible[si] = []
        for ai, agent in enumerate(agents):
            if (
                slot["skillId"] in agent["skillIds"]
                and slot["start"] in avail[ai]
                and slot["start"] not in busy[ai]
            ):
                var = model.NewBoolVar(f"x_{si}_{ai}")
                x[(si, ai)] = var
                eligible[si].append(ai)
                by_agent_start[(ai, slot["start"])].append(var)
                agent_vars[ai].append(var)

    for vars_ in by_agent_start.values():
        model.Add(sum(vars_) <= 1)

    shortfall = []
    for si, slot in enumerate(slots):
        assigned = sum(x[(si, ai)] for ai in eligible[si])
        short = model.NewIntVar(0, slot["required"], f"short_{si}")
        model.Add(assigned + short >= slot["required"])
        model.Add(assigned <= slot["required"])
        shortfall.append(short)

    max_load = model.NewIntVar(0, max(1, len(slots)), "max_load")
    for vars_ in agent_vars.values():
        model.Add(sum(vars_) <= max_load)

    model.Minimize(1000 * sum(shortfall) + max_load)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_sec
    solver.parameters.num_workers = 4
    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {"status": "infeasible", "assignments": [], "shortfalls": [], "coverage": 0}

    assignments, shortfalls = [], []
    for si, slot in enumerate(slots):
        for ai in eligible[si]:
            if solver.Value(x[(si, ai)]):
                assignments.append({"slotId": slot["id"], "agentId": agents[ai]["id"]})
        missing = solver.Value(shortfall[si])
        if missing:
            shortfalls.append({"slotId": slot["id"], "missing": missing})

    total_required = sum(s["required"] for s in slots)
    missing_total = sum(s["missing"] for s in shortfalls)
    return {
        "status": "optimal" if status == cp_model.OPTIMAL else "feasible",
        "assignments": assignments,
        "shortfalls": shortfalls,
        "coverage": round(1 - missing_total / total_required, 4) if total_required else 1,
    }
