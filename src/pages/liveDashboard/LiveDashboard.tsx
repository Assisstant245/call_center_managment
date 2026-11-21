import { useCallback, useEffect, useState } from "react";
import axios from "../../helper/api";
import { useLive } from "../../hooks/useLive";
import { REVIEWER_ROLES, errorMessage, hasRole } from "../../helper/session";
import {
  Alert,
  Button,
  Card,
  Field,
  PageHeader,
  Stat,
  Table,
  fmtTime,
  inputClass,
} from "../../components/ui";

interface LiveItem {
  skill: string;
  channel: string;
  forecastCalls: number;
  required: number;
  scheduled: number;
  onFloor: number;
  waiting: number;
  activeContacts: number;
  longestWaitSec: number;
  gap: number;
}

interface LiveData {
  intervalStart: string;
  generatedAt: string;
  store: string;
  items: LiveItem[];
}

const LiveDashboard = () => {
  const [data, setData] = useState<LiveData | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    skill: "",
    channel: "Voice",
    waiting: 0,
    activeContacts: 0,
    longestWaitSec: 0,
  });

  const load = useCallback(async () => {
    try {
      const res = await axios.get<LiveData>("/realtime/staffing");
      setData(res.data);
      setError("");
    } catch (e) {
      setError(errorMessage(e, "Failed to load live staffing"));
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000); // fallback if the socket drops
    return () => clearInterval(timer);
  }, [load]);

  const connected = useLive({ "staffing:update": (payload) => setData(payload) });

  const publish = async () => {
    try {
      await axios.post("/realtime/queue-metrics", {
        ...form,
        waiting: Number(form.waiting),
        activeContacts: Number(form.activeContacts),
        longestWaitSec: Number(form.longestWaitSec),
      });
      setMsg("Queue metrics published");
      setError("");
    } catch (e) {
      setMsg("");
      setError(errorMessage(e));
    }
  };

  const items = data?.items ?? [];
  const totals = items.reduce(
    (t, i) => ({
      required: t.required + i.required,
      onFloor: t.onFloor + i.onFloor,
      waiting: t.waiting + i.waiting,
    }),
    { required: 0, onFloor: 0, waiting: 0 },
  );

  return (
    <div>
      <PageHeader
        title="Live Staffing"
        subtitle={
          data
            ? `Interval ${fmtTime(data.intervalStart)} UTC · metrics store: ${data.store}`
            : "Current interval"
        }
        actions={
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              connected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {connected ? "● Live" : "○ Polling"}
          </span>
        }
      />

      {error && <Alert>{error}</Alert>}
      {msg && <Alert kind="success">{msg}</Alert>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Required now" value={totals.required} />
        <Stat label="On the floor" value={totals.onFloor} tone="green" />
        <Stat label="Contacts waiting" value={totals.waiting} tone={totals.waiting > 0 ? "amber" : "slate"} />
      </div>

      <Card title="Skill / channel status" className="mb-6">
        <Table
          head={["Skill", "Channel", "Forecast", "Required", "Scheduled", "On floor", "Gap", "Waiting", "Longest wait"]}
          empty={items.length === 0 ? "No forecast, schedule or queue data for this interval." : undefined}
        >
          {items.map((i) => (
            <tr key={`${i.skill}|${i.channel}`}>
              <td className="px-3 py-2 font-medium">{i.skill}</td>
              <td className="px-3 py-2">{i.channel}</td>
              <td className="px-3 py-2">{i.forecastCalls}</td>
              <td className="px-3 py-2">{i.required}</td>
              <td className="px-3 py-2">{i.scheduled}</td>
              <td className="px-3 py-2">{i.onFloor}</td>
              <td
                className={`px-3 py-2 font-semibold ${
                  i.gap < 0 ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {i.gap > 0 ? `+${i.gap}` : i.gap}
              </td>
              <td className="px-3 py-2">{i.waiting}</td>
              <td className="px-3 py-2">{i.longestWaitSec}s</td>
            </tr>
          ))}
        </Table>
      </Card>

      {hasRole(REVIEWER_ROLES) && (
        <Card title="Publish queue metrics (ACD integration / manual)">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Field label="Skill">
              <input
                className={inputClass}
                value={form.skill}
                onChange={(e) => setForm({ ...form, skill: e.target.value })}
                placeholder="Billing"
              />
            </Field>
            <Field label="Channel">
              <select
                className={inputClass}
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                <option>Voice</option>
                <option>Chat</option>
                <option>Email</option>
              </select>
            </Field>
            <Field label="Waiting">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.waiting}
                onChange={(e) => setForm({ ...form, waiting: Number(e.target.value) })}
              />
            </Field>
            <Field label="Active contacts">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.activeContacts}
                onChange={(e) => setForm({ ...form, activeContacts: Number(e.target.value) })}
              />
            </Field>
            <Field label="Longest wait (s)">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.longestWaitSec}
                onChange={(e) => setForm({ ...form, longestWaitSec: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Button onClick={publish} disabled={!form.skill}>
              Publish
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default LiveDashboard;
