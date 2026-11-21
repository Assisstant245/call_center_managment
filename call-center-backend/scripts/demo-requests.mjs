/**
 * Demo stories for Time Off, Shift Swaps and Adherence.
 * Needs: backend on :3000, `npm run seed -- --demo` and `node scripts/demo-fill.mjs` done.
 * Only touches demo agents (@demo.local).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../dist/generated/prisma/client.js";

const BASE = process.env.API_URL ?? "http://localhost:3000";
const PASS = "Demo#12345";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function call(method, path, token, body, allowFail = false) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (allowFail) return { error: data?.message ?? res.status };
    throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

const emailOf = (n) => `agent${String(n).padStart(3, "0")}@demo.local`;
const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

async function loginAs(n) {
  const email = emailOf(n);
  await call("POST", "/auth/signup", null, { name: `Demo Agent ${n}`, email, password: PASS }, true);
  return (await call("POST", "/auth/login", null, { email, password: PASS })).token;
}

const adminToken = (await call("POST", "/auth/login", null, { email: "demo-admin@demo.local", password: PASS })).token;
const agentId = async (n) => (await prisma.agent.findUnique({ where: { email: emailOf(n) } })).id;

try {
  // ------------------------------------------------------------------ TIME OFF
  console.log("== TIME OFF ==");
  const timeOff = [
    [4, 10, 12, "Vacation", "Cousin's wedding", "Approved", "Enjoy! Coverage is fine."],
    [5, 8, 8, "Sick", "Fever", "Rejected", "Month-end peak - please bring a medical note and re-apply."],
    [6, 15, 17, "Personal", "House shifting", "Pending"],
    [7, 14, 14, "Vacation", "Day off", "Pending"],
  ];
  for (const [n, from, to, type, reason, decision, note] of timeOff) {
    const created = await call("POST", "/time-off", adminToken,
      { agentId: await agentId(n), startDate: day(from), endDate: day(to), type, reason }, true);
    if (created.error) { console.log(`  agent${n}: skipped (${created.error})`); continue; }
    if (decision !== "Pending") {
      await call("PATCH", `/time-off/${created.id}/review`, adminToken, { decision, note });
    }
    console.log(`  agent${n}: ${type} ${day(from)}..${day(to)} -> ${decision}`);
  }

  // --------------------------------------------------------------- SHIFT SWAPS
  console.log("== SHIFT SWAPS ==");
  // Consecutive demo agents share a skill. Everyone works every day, so a swap = exchange of shift timings that day.
  const pairs = [
    [10, 11, "Pending"],    // waiting for colleague
    [12, 13, "Accepted"],   // waiting for manager
    [14, 15, "Approved"],   // completed
    [16, 17, "Declined"],   // colleague said no
  ];
  for (const [a, b, stage] of pairs) {
    const ida = await agentId(a);
    const idb = await agentId(b);
    let pair = null;
    for (let d = 3; d <= 12 && !pair; d++) {
      const date = new Date(`${day(d)}T00:00:00.000Z`);
      const [sa, sb] = await Promise.all([
        prisma.agentShift.findFirst({ where: { agentId: ida, workDate: date }, include: { shift: true } }),
        prisma.agentShift.findFirst({ where: { agentId: idb, workDate: date }, include: { shift: true } }),
      ]);
      if (sa && sb && sa.shiftId !== sb.shiftId) pair = { sa, sb, date: day(d) };
    }
    if (!pair) { console.log(`  agent${a}<->agent${b}: no suitable day`); continue; }

    const ta = await loginAs(a);
    const tb = await loginAs(b);
    const swap = await call("POST", "/shift-swaps", ta,
      { requesterShiftId: pair.sa.id, targetShiftId: pair.sb.id, reason: "Personal work in my slot" }, true);
    if (swap.error) { console.log(`  agent${a}<->agent${b}: skipped (${swap.error})`); continue; }

    if (stage === "Accepted" || stage === "Approved") {
      await call("PATCH", `/shift-swaps/${swap.id}/respond`, tb, { accept: true });
    }
    if (stage === "Declined") {
      await call("PATCH", `/shift-swaps/${swap.id}/respond`, tb, { accept: false });
    }
    if (stage === "Approved") {
      await call("PATCH", `/shift-swaps/${swap.id}/review`, adminToken, { decision: "Approved", note: "Approved" });
    }
    console.log(`  agent${a} (${pair.sa.shift.name}) <-> agent${b} (${pair.sb.shift.name}) on ${pair.date}: ${stage}`);
  }

  // ----------------------------------------------------------------- ADHERENCE
  console.log("== ADHERENCE ==");
  const now = Date.now();
  const startOfDay = new Date(`${day(0)}T00:00:00.000Z`);
  // Agents who already have at least 90 minutes of schedule behind them today
  const scheduled = await prisma.agentSchedule.findMany({
    where: { agent: { email: { endsWith: "@demo.local" } }, intervalStart: { gte: startOfDay, lt: new Date(now - 90 * 60000) } },
    orderBy: { intervalStart: "asc" },
    include: { agent: true },
  });
  const firstStart = new Map();
  for (const s of scheduled) if (!firstStart.has(s.agentId)) firstStart.set(s.agentId, s);
  const chosen = [...firstStart.values()].slice(0, 6);

  const stories = [
    ["perfect: logs in 5 min early, works all day", (S) => [["Available", -5]]],
    ["late: logs in 40 minutes after shift start", (S) => [["Offline", -5], ["Available", 40]]],
    ["long break: 60 minute break", (S) => [["Available", -5], ["Break", 30], ["Available", 90]]],
    ["meeting: 30 minute team meeting (counts as non-adherent)", (S) => [["Available", -5], ["Meeting", 30], ["Available", 60]]],
    ["left early: went Offline 60 minutes into shift", (S) => [["Available", -5], ["Offline", 60]]],
    ["on calls: OnCall all along (counts as adherent)", (S) => [["OnCall", -5]]],
  ];

  for (let i = 0; i < chosen.length; i++) {
    const { agentId: id, intervalStart, agent } = chosen[i];
    const S = intervalStart.getTime();
    // clear this demo agent's events for today so the story is clean
    await prisma.adherenceEvent.deleteMany({ where: { agentId: id, occurredAt: { gte: startOfDay } } });
    const events = stories[i][1](S);
    for (const [state, minutes] of events) {
      const at = new Date(S + minutes * 60000);
      if (at.getTime() > now) continue;
      await call("POST", "/adherence/events", adminToken, { agentId: id, state, at: at.toISOString() });
    }
    console.log(`  ${agent.name} (${agent.employeeId}), shift starts ${intervalStart.toISOString().slice(11, 16)} UTC -> ${stories[i][0]}`);
  }

  console.log("\nDONE");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
