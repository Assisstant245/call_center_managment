/**
 * Fills the running system with demo activity so every page has something to show.
 * Needs: backend on :3000, forecasting service on :8000, `npm run seed -- --demo` done.
 * Usage: node scripts/demo-fill.mjs
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../dist/generated/prisma/client.js";

const BASE = process.env.API_URL ?? "http://localhost:3000";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const ADMIN = { name: "Demo Admin", email: "demo-admin@demo.local", password: "Demo#12345" };

async function call(method, path, token, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(data)}`);
  return data;
}

const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

try {
  // 1. demo admin account
  await call("POST", "/auth/signup", null, ADMIN).catch(() => undefined); // exists already? fine
  await prisma.user.update({ where: { email: ADMIN.email }, data: { role: "admin" } });
  const { token } = await call("POST", "/auth/login", null, { email: ADMIN.email, password: ADMIN.password });
  console.log("1. Demo admin ready:", ADMIN.email, "/", ADMIN.password);

  // 2. forecast today + tomorrow (all skills, all channels)
  for (const d of [day(0), day(1)]) {
    const f = await call("POST", "/forecast/generate", token, { startDate: d, withAccuracy: d === day(0) });
    console.log(`2. Forecast ${d}: ${f.generatedRows} intervals`);
    if (d === day(0)) {
      for (const s of f.series.slice(0, 12)) {
        console.log(`   ${s.skill.padEnd(18)} ${s.channel.padEnd(6)} MAPE ${s.accuracy?.mape ?? "-"}%`);
      }
    }
  }

  // 3. auto-schedule both days
  for (const d of [day(0), day(1)]) {
    const s = await call("POST", "/agent-schedule/generate-day", token, { date: d, replaceExisting: true });
    console.log(`3. Schedule ${d}: engine=${s.engine} assigned=${s.scheduledAssignments} coverage=${Math.round(s.coverage * 100)}%`);
  }

  // 4. adherence: put some scheduled agents "on the floor" right now
  const now = new Date();
  const slot = new Date(Math.floor(now.getTime() / 1800000) * 1800000);
  const working = await prisma.agentSchedule.findMany({ where: { intervalStart: slot }, take: 400 });
  let i = 0;
  for (const w of working) {
    // ~80% available, ~10% on a call, ~10% on break (shows violations)
    const state = i % 10 < 8 ? "Available" : i % 10 === 8 ? "OnCall" : "Break";
    await call("POST", "/adherence/events", token, {
      agentId: w.agentId,
      state,
      at: new Date(slot.getTime() + 2 * 60000).toISOString(),
    });
    i++;
  }
  console.log(`4. Adherence: set status for ${working.length} agents scheduled now`);

  // 5. queue metrics for the live page
  const skills = await prisma.skill.findMany({ where: { status: "Active" } });
  for (const s of skills) {
    for (const ch of ["Voice", "Chat", "Email"]) {
      await call("POST", "/realtime/queue-metrics", token, {
        skill: s.name,
        channel: ch,
        waiting: Math.floor(Math.random() * 8),
        activeContacts: 5 + Math.floor(Math.random() * 20),
        longestWaitSec: Math.floor(Math.random() * 60),
      });
    }
  }
  console.log("5. Queue metrics published (Live Staffing page)");

  // 6. a pending time-off request (as demo agent 003) for the approval screen
  const agentEmail = "agent003@demo.local";
  const agentUser = await prisma.user.findUnique({ where: { email: agentEmail } });
  if (!agentUser) {
    await call("POST", "/auth/signup", null, { name: "Demo Agent 3", email: agentEmail, password: ADMIN.password });
  }
  const agentToken = (await call("POST", "/auth/login", null, { email: agentEmail, password: ADMIN.password })).token;
  const pending = await call("GET", "/time-off?status=Pending", agentToken);
  if (pending.length === 0) {
    await call("POST", "/time-off", agentToken, { startDate: day(10), endDate: day(12), type: "Vacation", reason: "Family trip" });
  }
  console.log(`6. Pending time-off request for ${agentEmail} (login ${agentEmail} / ${ADMIN.password})`);

  console.log("\nDONE");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
