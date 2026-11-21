import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../helper/api";
import { errorMessage } from "../../helper/session";
import { useLive } from "../../hooks/useLive";
import {
  Alert,
  Badge,
  Button,
  Card,
  PageHeader,
  Stat,
  fmtDate,
  fmtTime,
} from "../../components/ui";

interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
}

interface Block {
  skill: string;
  channel: string;
  start: string;
  end: string;
}

interface Swap {
  id: number;
  status: string;
  requesterId: number;
  targetId: number;
  requester: { id: number; name: string };
  target: { id: number; name: string };
  requesterShift: { workDate: string; shift: Shift };
  targetShift: { workDate: string; shift: Shift };
}

interface Data {
  agent: { id: number; name: string; employeeId: string; status: string; skills: string[] };
  todayShift: Shift | null;
  currentAssignment: Block | null;
  nextBlock: Block | null;
  todayBlocks: Block[];
  tomorrowBlocks: Block[];
  todayScheduledMinutes: number;
  upcomingShifts: { id: number; workDate: string; shift: Shift }[];
  upcomingScheduledIntervals: number;
  adherence: { pct: number | null; scheduledMinutes: number; adherentMinutes: number } | null;
  requests: {
    timeOff: { id: number; startDate: string; endDate: string; type: string; status: string }[];
    swaps: Swap[];
  };
  unreadNotifications: number;
}

const STATES = ["Available", "OnCall", "Break", "Meeting", "Offline"];

const MyDashboard = () => {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await axios.get<Data>("/dashboard/me");
      setData(res.data);
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  useLive({ notification: () => load() });

  const setStatus = async (state: string) => {
    try {
      await axios.post("/adherence/events", { state });
      setOk(`Status set to ${state}`);
      load();
    } catch (e) {
      setOk("");
      setError(errorMessage(e));
    }
  };

  if (!data) {
    return (
      <div>
        <PageHeader title="My Dashboard" />
        {!error && <p className="text-sm text-slate-400">Loading…</p>}
        {error.includes("No agent profile") ? (
          <Card title="Your agent profile is not set up yet">
            <p className="text-sm text-slate-600">
              Your login works, but no agent profile exists for your e-mail address yet, so there is no
              schedule to show.
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              <li>Ask your manager to open <b>Agents → Create Agent</b>.</li>
              <li>They must use <b>the same e-mail you signed up with</b>, and pick your skills and shift.</li>
              <li>Log out and log in again — this page will then show your shifts and schedule.</li>
            </ol>
            <p className="mt-3 text-xs text-slate-400">
              You can already use <Link to="/time-off" className="text-blue-600 underline">Time Off</Link> only after the profile exists.
            </p>
          </Card>
        ) : (
          error && <Alert>{error}</Alert>
        )}
      </div>
    );
  }

  const pct = data.adherence?.pct ?? null;
  const pctTone = pct === null ? "slate" : pct >= 90 ? "green" : pct >= 75 ? "amber" : "red";
  const waiting = data.requests.swaps.filter((s) => s.status === "Pending" && s.targetId === data.agent.id);

  return (
    <div>
      <PageHeader
        title={`Hello, ${data.agent.name.split(" ")[0]}`}
        subtitle={`${data.agent.employeeId} · Skills: ${data.agent.skills.join(", ") || "none yet"}`}
        actions={<Badge value={data.agent.status} />}
      />

      {error && <Alert>{error}</Alert>}
      {ok && <Alert kind="success">{ok}</Alert>}

      {waiting.length > 0 && (
        <Alert kind="info">
          {waiting.length} colleague(s) asked to swap shifts with you.{" "}
          <Link to="/shift-swaps" className="font-semibold underline">Respond</Link>
        </Alert>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Today's shift"
          value={
            data.todayShift
              ? `${fmtTime(data.todayShift.startTime)}–${fmtTime(data.todayShift.endTime)}`
              : "Off"
          }
          tone={data.todayShift ? "blue" : "slate"}
        />
        <Stat label="Scheduled today" value={`${data.todayScheduledMinutes} min`} tone="slate" />
        <Stat label="My adherence" value={pct === null ? "—" : `${pct}%`} tone={pctTone} />
        <Stat label="Unread alerts" value={data.unreadNotifications} tone={data.unreadNotifications ? "amber" : "slate"} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Right now">
          {data.currentAssignment ? (
            <p className="text-sm text-slate-700">
              You are assigned to <b>{data.currentAssignment.skill}</b> ({data.currentAssignment.channel}) until{" "}
              <b>{fmtTime(data.currentAssignment.end)}</b> UTC.
            </p>
          ) : data.nextBlock ? (
            <p className="text-sm text-slate-700">
              Nothing assigned right now. Next: <b>{data.nextBlock.skill}</b> ({data.nextBlock.channel}) at{" "}
              <b>{fmtTime(data.nextBlock.start)}</b> UTC.
            </p>
          ) : (
            <p className="text-sm text-slate-500">Nothing scheduled for the rest of today.</p>
          )}

          <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-slate-400">Set my status</p>
          <div className="flex flex-wrap gap-2">
            {STATES.map((s) => (
              <Button key={s} variant={s === data.agent.status ? "primary" : "secondary"} onClick={() => setStatus(s)}>
                {s}
              </Button>
            ))}
          </div>
          {data.adherence && data.adherence.scheduledMinutes > 0 && (
            <p className="mt-4 text-xs text-slate-400">
              Adherent {data.adherence.adherentMinutes} of {data.adherence.scheduledMinutes} scheduled minutes so far.
            </p>
          )}
        </Card>

        <Card title="Today's work blocks (UTC)">
          {data.todayBlocks.length === 0 ? (
            <p className="text-sm text-slate-400">No scheduled work today.</p>
          ) : (
            <ul className="space-y-2">
              {data.todayBlocks.map((b) => (
                <li key={b.start} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-700">{fmtTime(b.start)} – {fmtTime(b.end)}</span>
                  <span className="text-slate-500">{b.skill} · {b.channel}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Tomorrow's work blocks (UTC)" className="mb-6">
        {data.tomorrowBlocks.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing assigned for tomorrow yet. Your manager generates the schedule.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {data.tomorrowBlocks.map((b) => (
              <li key={b.start} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-slate-700">{fmtTime(b.start)} – {fmtTime(b.end)}</span>
                <span className="text-slate-500">{b.skill} · {b.channel}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="My next 7 days">
          {data.upcomingShifts.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming shifts.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.upcomingShifts.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span className="text-slate-700">{fmtDate(s.workDate)}</span>
                  <span className="text-slate-500">
                    {fmtTime(s.shift.startTime)}–{fmtTime(s.shift.endTime)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/agentSchedule" className="mt-3 inline-block text-xs font-medium text-blue-600 hover:underline">
            Full schedule →
          </Link>
        </Card>

        <Card title="My time off">
          {data.requests.timeOff.length === 0 ? (
            <p className="text-sm text-slate-400">No pending or upcoming leave.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.requests.timeOff.map((t) => (
                <li key={t.id} className="flex items-center justify-between">
                  <span className="text-slate-700">{fmtDate(t.startDate)}{t.startDate !== t.endDate && ` – ${fmtDate(t.endDate)}`}</span>
                  <Badge value={t.status} />
                </li>
              ))}
            </ul>
          )}
          <Link to="/time-off" className="mt-3 inline-block text-xs font-medium text-blue-600 hover:underline">
            Request time off →
          </Link>
        </Card>

        <Card title="My open swaps">
          {data.requests.swaps.length === 0 ? (
            <p className="text-sm text-slate-400">No open swap requests.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.requests.swaps.map((s) => (
                <li key={s.id} className="flex items-center justify-between">
                  <span className="text-slate-700">
                    {s.requesterId === data.agent.id ? `You → ${s.target.name}` : `${s.requester.name} → You`}
                  </span>
                  <Badge value={s.status} />
                </li>
              ))}
            </ul>
          )}
          <Link to="/shift-swaps" className="mt-3 inline-block text-xs font-medium text-blue-600 hover:underline">
            Shift swaps →
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default MyDashboard;
