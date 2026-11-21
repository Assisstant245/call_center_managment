/**
 * Pure scheduling helpers (no database / network access) so they can be
 * unit-tested. The heavy-weight optimiser lives in the Python service; this
 * file contains the availability maths and a greedy fallback with the same
 * input/output shape.
 */

export const SLOT_MS = 30 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

export interface DemandSlot {
  id: string;
  skillId: number;
  channel: string;
  /** epoch ms of the slot start */
  start: number;
  required: number;
  forecastId?: number | null;
}

export interface SchedulableAgent {
  id: number;
  skillIds: number[];
  /** slot starts (epoch ms) the agent is on shift for */
  availableStarts: number[];
  /** slot starts the agent is already booked for */
  busyStarts: number[];
}

export interface ScheduleResult {
  status: string;
  engine: "optimizer" | "greedy";
  assignments: { slotId: string; agentId: number }[];
  shortfalls: { slotId: string; missing: number }[];
  coverage: number;
}

/** Milliseconds since midnight (UTC) of the given instant. */
export function timeOfDayMs(d: Date): number {
  return (
    d.getUTCHours() * 3_600_000 +
    d.getUTCMinutes() * 60_000 +
    d.getUTCSeconds() * 1000
  );
}

/** UTC midnight of the given date. */
export function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Concrete working window of a shift on a given work date. Only the UTC
 * time-of-day of the shift's start/end is used, so shifts that end earlier
 * than they start (night shifts) run into the next day.
 */
export function shiftWindow(
  workDate: Date,
  shiftStart: Date,
  shiftEnd: Date,
): { start: number; end: number } {
  const dayStart = utcMidnight(workDate).getTime();
  const startTod = timeOfDayMs(shiftStart);
  let duration = timeOfDayMs(shiftEnd) - startTod;
  if (duration <= 0) duration += DAY_MS;

  return { start: dayStart + startTod, end: dayStart + startTod + duration };
}

/** 30-minute slot starts fully inside any of the windows, limited to [from, to). */
export function slotStartsInWindows(
  windows: { start: number; end: number }[],
  from: number,
  to: number,
): number[] {
  const out = new Set<number>();
  for (const w of windows) {
    const first = Math.max(w.start, from);
    let cursor = Math.ceil(first / SLOT_MS) * SLOT_MS;
    while (cursor + SLOT_MS <= w.end && cursor < to) {
      out.add(cursor);
      cursor += SLOT_MS;
    }
  }
  return [...out].sort((a, b) => a - b);
}

/**
 * Greedy fallback: handle the hardest slots first and always pick the
 * eligible agent with the lightest load so far.
 */
export function greedySchedule(
  slots: DemandSlot[],
  agents: SchedulableAgent[],
): ScheduleResult {
  const prepared = agents.map((a) => ({
    id: a.id,
    skills: new Set(a.skillIds),
    available: new Set(a.availableStarts),
    busy: new Set(a.busyStarts),
  }));

  const eligibleFor = (slot: DemandSlot) =>
    prepared.filter(
      (a) =>
        a.skills.has(slot.skillId) &&
        a.available.has(slot.start) &&
        !a.busy.has(slot.start),
    );

  const ordered = slots
    .map((slot) => ({ slot, eligible: eligibleFor(slot) }))
    .sort(
      (x, y) =>
        x.eligible.length - x.slot.required - (y.eligible.length - y.slot.required) ||
        x.slot.start - y.slot.start,
    );

  const load = new Map<number, number>();
  const taken = new Set<string>();
  const assignments: ScheduleResult["assignments"] = [];
  const shortfalls: ScheduleResult["shortfalls"] = [];

  for (const { slot, eligible } of ordered) {
    const candidates = eligible
      .filter((a) => !taken.has(`${a.id}:${slot.start}`))
      .sort(
        (a, b) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0) || a.id - b.id,
      );

    const chosen = candidates.slice(0, slot.required);
    for (const agent of chosen) {
      taken.add(`${agent.id}:${slot.start}`);
      load.set(agent.id, (load.get(agent.id) ?? 0) + 1);
      assignments.push({ slotId: slot.id, agentId: agent.id });
    }

    if (chosen.length < slot.required) {
      shortfalls.push({ slotId: slot.id, missing: slot.required - chosen.length });
    }
  }

  const totalRequired = slots.reduce((sum, s) => sum + s.required, 0);
  const missing = shortfalls.reduce((sum, s) => sum + s.missing, 0);

  return {
    status: "heuristic",
    engine: "greedy",
    assignments,
    shortfalls,
    coverage: totalRequired ? Number((1 - missing / totalRequired).toFixed(4)) : 1,
  };
}
