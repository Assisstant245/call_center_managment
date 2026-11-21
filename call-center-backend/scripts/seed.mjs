/**
 * Database seed.
 *
 *   npm run seed            -> imports historical call data + makes sure an admin exists
 *   npm run seed -- --demo [--agents=800] -> additionally creates demo agents/shifts (@demo.local)
 *   npm run seed -- --clean-demo -> removes the demo agents again
 *
 * Needs the project to be built first (npm run build) - the npm script does that.
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../dist/generated/prisma/client.js";

const here = dirname(fileURLToPath(import.meta.url));
const csvPath = resolve(
  process.env.HISTORY_CSV ?? resolve(here, "../../forecasting-service/data/Call_History.csv"),
);
const args = new Set(process.argv.slice(2));

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEMO_DOMAIN = "@demo.local";

async function ensureAdmin() {
  const admins = await prisma.user.count({ where: { role: "admin" } });
  if (admins > 0) return console.log("Admin already exists");

  const first = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!first) return console.log("No users yet - the first signup becomes admin");

  await prisma.user.update({ where: { id: first.id }, data: { role: "admin" } });
  console.log(`Promoted ${first.email} to admin`);
}

async function importHistory() {
  if (!existsSync(csvPath)) return console.log(`History CSV not found: ${csvPath}`);

  const [header, ...lines] = readFileSync(csvPath, "utf8").split(/\r?\n/).filter(Boolean);
  const cols = header.split(",");
  const rows = lines.map((l) => Object.fromEntries(l.split(",").map((v, i) => [cols[i], v])));

  const skills = new Map();
  for (const name of new Set(rows.map((r) => r.skill))) {
    const skill = await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name, description: "Imported from call history" },
    });
    skills.set(name, skill.id);
  }

  const data = rows.map((r) => ({
    intervalStart: new Date(`${r.interval_start.replace(" ", "T")}Z`),
    channel: r.channel,
    skillId: skills.get(r.skill),
    callsOffered: Number(r.calls_offered),
    callsAnswered: Number(r.calls_answered),
    callsAbandoned: Number(r.calls_abandoned),
    avgHandleSec: Number(r.average_handle_time_sec),
    avgWaitSec: Number(r.average_wait_time_sec),
  }));

  let inserted = 0;
  for (let i = 0; i < data.length; i += 1000) {
    inserted += (await prisma.callHistory.createMany({ data: data.slice(i, i + 1000), skipDuplicates: true })).count;
  }
  console.log(`Call history: ${inserted} new rows (${rows.length} in file)`);
}

async function demoData() {
  const skills = await prisma.skill.findMany({ where: { status: "Active" } });
  if (skills.length === 0) return console.log("Import history first (skills missing)");

  // Shifts are stored as UTC time-of-day
  const defs = [
    ["Demo Morning 08-16", "08:00", "16:00"],
    ["Demo Evening 14-22", "14:00", "22:00"],
    ["Demo Full 08-22", "08:00", "22:00"],
  ];
  const shifts = [];
  for (const [name, start, end] of defs) {
    const found = await prisma.shift.findFirst({ where: { name } });
    shifts.push(
      found ??
        (await prisma.shift.create({
          data: {
            name,
            startTime: new Date(`1970-01-01T${start}:00.000Z`),
            endTime: new Date(`1970-01-01T${end}:00.000Z`),
            breakMinutes: 60,
          },
        })),
    );
  }

  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) =>
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i)),
  );

  const AGENTS = Number([...args].find((a) => a.startsWith("--agents="))?.split("=")[1] ?? 800);
  for (let n = 1; n <= AGENTS; n++) {
    const email = `agent${String(n).padStart(3, "0")}${DEMO_DOMAIN}`;
    const existing = await prisma.agent.findUnique({ where: { email } });
    if (existing) {
      // already created earlier: just top up the shifts for the coming days
      await prisma.agentShift.createMany({
        data: days.map((d) => ({
          agentId: existing.id,
          workDate: d,
          shiftId: shifts[(n + d.getUTCDate()) % shifts.length].id,
        })),
        skipDuplicates: true,
      });
      continue;
    }

    // each agent: 2 skills
    const mine = [skills[n % skills.length], skills[(n + 1) % skills.length]];

    await prisma.agent.create({
      data: {
        employeeId: `DEMO-${String(n).padStart(3, "0")}`,
        name: `Demo Agent ${n}`,
        email,
        agentSkills: { create: mine.map((s) => ({ skillId: s.id })) },
        agentShifts: {
          create: days.map((d) => ({
            workDate: d,
            shiftId: shifts[(n + d.getUTCDate()) % shifts.length].id,
          })),
        },
      },
    });
  }
  console.log(`Demo data ready: ${AGENTS} agents, ${shifts.length} shifts, ${days.length} days`);
}

async function cleanDemo() {
  const agents = await prisma.agent.deleteMany({ where: { email: { endsWith: DEMO_DOMAIN } } });
  const shifts = await prisma.shift.deleteMany({ where: { name: { startsWith: "Demo " } } });
  console.log(`Removed ${agents.count} demo agents and ${shifts.count} demo shifts`);
}

try {
  if (args.has("--clean-demo")) {
    await cleanDemo();
  } else {
    await ensureAdmin();
    await importHistory();
    if (args.has("--demo")) await demoData();
  }
} finally {
  await prisma.$disconnect();
}
