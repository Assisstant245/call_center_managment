import { useCallback, useEffect, useState } from "react";
import axios from "../../helper/api";
import { REVIEWER_ROLES, errorMessage, hasRole } from "../../helper/session";
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  PageHeader,
  Stat,
  Table,
  fmtTime,
  inputClass,
  todayIso,
} from "../../components/ui";

interface AgentAdherence {
  agentId: number;
  employeeId: string;
  name: string;
  currentState: string;
  scheduledMinutes: number;
  adherentMinutes: number;
  adherencePct: number | null;
  violations: { start: string; end: string; state: string; minutes: number }[];
}

interface Report {
  date: string;
  overallAdherencePct: number | null;
  scheduledMinutes: number;
  adherentMinutes: number;
  agents: AgentAdherence[];
}

const STATES = ["Available", "OnCall", "Break", "Meeting", "Offline"];

const AdherencePage = () => {
  const isReviewer = hasRole(REVIEWER_ROLES);
  const [date, setDate] = useState(todayIso());
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    if (!isReviewer) return;
    try {
      const { data } = await axios.get<Report>("/adherence", { params: { date } });
      setReport(data);
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [date, isReviewer]);

  useEffect(() => {
    load();
  }, [load]);

  const setState = async (state: string) => {
    try {
      await axios.post("/adherence/events", { state });
      setOk(`Status set to ${state}`);
      setError("");
      load();
    } catch (e) {
      setOk("");
      setError(errorMessage(e));
    }
  };

  const pctTone = (p: number | null) =>
    p === null ? "text-slate-400" : p >= 90 ? "text-emerald-600" : p >= 75 ? "text-amber-600" : "text-red-600";

  return (
    <div>
      <PageHeader title="Schedule Adherence" subtitle="Time spent available or on a call while scheduled, measured up to now." />
      {error && <Alert>{error}</Alert>}
      {ok && <Alert kind="success">{ok}</Alert>}

      <Card title="My status" className="mb-6">
        <div className="flex flex-wrap gap-2">
          {STATES.map((s) => (
            <Button key={s} variant="secondary" onClick={() => setState(s)}>{s}</Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">Your status feeds adherence and the live staffing view.</p>
      </Card>

      {isReviewer && report && (
        <>
          <div className="mb-4 flex items-end gap-3">
            <Field label="Date (UTC)">
              <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat
              label="Overall adherence"
              value={report.overallAdherencePct === null ? "—" : `${report.overallAdherencePct}%`}
              tone={report.overallAdherencePct !== null && report.overallAdherencePct < 75 ? "red" : "green"}
            />
            <Stat label="Scheduled (min)" value={report.scheduledMinutes} tone="slate" />
            <Stat label="Adherent (min)" value={report.adherentMinutes} tone="blue" />
          </div>

          <Card title="Agents">
            <Table
              head={["Agent", "Now", "Scheduled", "Adherent", "Adherence", "Out of adherence"]}
              empty={report.agents.length === 0 ? "No scheduled agents for this day." : undefined}
            >
              {report.agents.map((a) => (
                <tr key={a.agentId}>
                  <td className="px-3 py-2">
                    {a.name} <span className="text-xs text-slate-400">{a.employeeId}</span>
                  </td>
                  <td className="px-3 py-2"><Badge value={a.currentState} /></td>
                  <td className="px-3 py-2">{a.scheduledMinutes} min</td>
                  <td className="px-3 py-2">{a.adherentMinutes} min</td>
                  <td className={`px-3 py-2 font-semibold ${pctTone(a.adherencePct)}`}>
                    {a.adherencePct === null ? "—" : `${a.adherencePct}%`}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {a.violations.slice(0, 3).map((v) => (
                      <div key={v.start}>{fmtTime(v.start)}–{fmtTime(v.end)} {v.state} ({v.minutes}m)</div>
                    ))}
                    {a.violations.length > 3 && <div>+{a.violations.length - 3} more</div>}
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdherencePage;
