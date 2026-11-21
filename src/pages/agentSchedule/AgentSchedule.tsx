import { useCallback, useEffect, useState } from "react";
import axios from "../../helper/api";
import { MANAGEMENT_ROLES, errorMessage, hasRole } from "../../helper/session";
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  PageHeader,
  Table,
  fmtTime,
  inputClass,
} from "../../components/ui";

interface ScheduleRow {
  id: number;
  agent: { id: number; employeeId: string; name: string };
  skill: { id: number; name: string };
  channel: string;
  intervalStart: string;
  intervalEnd: string;
  status: string;
}

interface GenerateResult {
  engine: string;
  status: string;
  slots?: number;
  scheduledAssignments: number;
  coverage: number;
  message?: string;
  shortfalls: { intervalStart: string; channel: string; missing: number }[];
}

const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

const AgentSchedule = () => {
  const canManage = hasRole(MANAGEMENT_ROLES);
  const [date, setDate] = useState(tomorrow());
  const [skill, setSkill] = useState("");
  const [skills, setSkills] = useState<{ id: number; name: string }[]>([]);
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [replace, setReplace] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    axios.get("/skills").then((r) => setSkills(r.data.data ?? [])).catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<ScheduleRow[]>("/agent-schedule", {
        params: { date, skill: skill || undefined },
      });
      setRows(data);
      setError("");
    } catch (e) {
      setError(errorMessage(e, "Failed to load agent schedule"));
    } finally {
      setLoading(false);
    }
  }, [date, skill]);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async () => {
    setBusy(true);
    setResult(null);
    try {
      const { data } = await axios.post<GenerateResult>("/agent-schedule/generate-day", {
        date,
        skill: skill || undefined,
        replaceExisting: replace,
      });
      setResult(data);
      setError("");
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await axios.delete(`/agent-schedule/${id}`);
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader
        title="Agent Schedule"
        subtitle="Interval assignments generated from the forecast with the OR-Tools optimiser (greedy fallback)."
      />

      {error && <Alert>{error}</Alert>}

      <Card className="mb-6">
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
          <Field label="Date (UTC)">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Skill">
            <select className={inputClass} value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="">All skills</option>
              {skills.map((s) => (
                <option key={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          {canManage && (
            <>
              <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
                <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
                Replace existing
              </label>
              <div className="pb-0.5">
                <Button onClick={generate} disabled={busy}>
                  {busy ? "Optimising…" : "Auto-schedule day"}
                </Button>
              </div>
            </>
          )}
        </div>

        {result && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              {result.message ?? (
                <>
                  Engine <b>{result.engine}</b> ({result.status}) assigned{" "}
                  <b>{result.scheduledAssignments}</b> interval slots · coverage{" "}
                  <b>{Math.round(result.coverage * 100)}%</b>
                </>
              )}
            </p>
            {result.shortfalls.length > 0 && (
              <p className="mt-1 text-amber-700">
                {result.shortfalls.length} interval(s) are understaffed — add agents or shifts for that day.
              </p>
            )}
          </div>
        )}
      </Card>

      <Card title={`Schedule (${rows.length})`}>
        {loading ? (
          <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
        ) : (
          <Table
            head={["Time (UTC)", "Agent", "Skill", "Channel", "Status", ...(canManage ? [""] : [])]}
            empty={rows.length === 0 ? "No schedule entries for this selection." : undefined}
          >
            {rows.slice(0, 500).map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2">
                  {fmtTime(r.intervalStart)} – {fmtTime(r.intervalEnd)}
                </td>
                <td className="px-3 py-2">
                  {r.agent.name} <span className="text-xs text-slate-400">{r.agent.employeeId}</span>
                </td>
                <td className="px-3 py-2">{r.skill.name}</td>
                <td className="px-3 py-2">{r.channel}</td>
                <td className="px-3 py-2">
                  <Badge value={r.status} />
                </td>
                {canManage && (
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => remove(r.id)} className="text-xs text-red-600 hover:underline">
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </Table>
        )}
        {rows.length > 500 && (
          <p className="mt-3 text-xs text-slate-400">Showing first 500 of {rows.length} entries.</p>
        )}
      </Card>
    </div>
  );
};

export default AgentSchedule;
