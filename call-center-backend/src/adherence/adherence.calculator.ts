/**
 * Schedule-adherence maths (pure functions, unit-tested).
 *
 * Adherence % = time the agent was in a "working" state while scheduled
 *               / total scheduled time (up to "now").
 */

export const WORKING_STATES = ["Available", "OnCall"] as const;
export const ALL_STATES = [
  "Available",
  "OnCall",
  "Break",
  "Meeting",
  "Offline",
] as const;

export interface Interval {
  start: number;
  end: number;
}

export interface StateEvent {
  state: string;
  at: number;
}

export interface AdherenceResult {
  scheduledMinutes: number;
  adherentMinutes: number;
  adherencePct: number | null;
  /** periods the agent was scheduled but not in a working state */
  violations: { start: number; end: number; state: string }[];
}

/** Merge overlapping/touching intervals. */
export function mergeIntervals(intervals: Interval[]): Interval[] {
  const sorted = intervals
    .filter((i) => i.end > i.start)
    .sort((a, b) => a.start - b.start);

  const merged: Interval[] = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end) {
      last.end = Math.max(last.end, interval.end);
    } else {
      merged.push({ ...interval });
    }
  }
  return merged;
}

function overlap(a: Interval, b: Interval): Interval | null {
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  return end > start ? { start, end } : null;
}

/**
 * @param schedule       scheduled work intervals of the agent
 * @param events         state-change events (any order)
 * @param stateBefore    the state at windowStart (last known event before it)
 * @param windowStart    start of the period being measured
 * @param windowEnd      end of the period (capped to `now`)
 */
export function computeAdherence(
  schedule: Interval[],
  events: StateEvent[],
  stateBefore: string,
  windowStart: number,
  windowEnd: number,
): AdherenceResult {
  const scheduled = mergeIntervals(schedule)
    .map((i) => overlap(i, { start: windowStart, end: windowEnd }))
    .filter((i): i is Interval => i !== null);

  const sorted = [...events]
    .filter((e) => e.at >= windowStart && e.at < windowEnd)
    .sort((a, b) => a.at - b.at);

  // State timeline over the window
  const segments: { start: number; end: number; state: string }[] = [];
  let cursor = windowStart;
  let state = stateBefore;
  for (const event of sorted) {
    if (event.at > cursor) segments.push({ start: cursor, end: event.at, state });
    cursor = event.at;
    state = event.state;
  }
  if (windowEnd > cursor) segments.push({ start: cursor, end: windowEnd, state });

  let scheduledMs = 0;
  let adherentMs = 0;
  const violations: AdherenceResult["violations"] = [];

  for (const sched of scheduled) {
    scheduledMs += sched.end - sched.start;

    for (const seg of segments) {
      const common = overlap(sched, seg);
      if (!common) continue;

      if ((WORKING_STATES as readonly string[]).includes(seg.state)) {
        adherentMs += common.end - common.start;
      } else {
        const last = violations[violations.length - 1];
        if (last && last.state === seg.state && last.end === common.start) {
          last.end = common.end;
        } else {
          violations.push({ ...common, state: seg.state });
        }
      }
    }
  }

  return {
    scheduledMinutes: Math.round(scheduledMs / 60_000),
    adherentMinutes: Math.round(adherentMs / 60_000),
    adherencePct: scheduledMs > 0 ? Number(((adherentMs / scheduledMs) * 100).toFixed(1)) : null,
    violations,
  };
}
