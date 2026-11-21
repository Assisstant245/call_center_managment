import { useCallback, useEffect, useState } from "react";
import axios from "../../helper/api";
import { MANAGEMENT_ROLES, errorMessage, hasRole } from "../../helper/session";
import {
  Alert,
  Button,
  Card,
  Field,
  PageHeader,
  Stat,
  Table,
  inputClass,
} from "../../components/ui";

interface Kpis {
  offered: number;
  answered: number;
  abandoned: number;
  answerRatePct: number | null;
  abandonRatePct: number | null;
  avgHandleSec: number | null;
  avgWaitSec: number | null;
}

interface Performance {
  summary: Kpis;
  rows: ({ key: string } & Kpis)[];
}

interface Accuracy {
  comparedIntervals: number;
  mae: number | null;
  mapePct: number | null;
  daily: { date: string; forecast: number; actual: number }[];
  note?: string;
}

const ReportsPage = () => {
  const canImport = hasRole(MANAGEMENT_ROLES);
  const [filters, setFilters] = useState({ from: "", to: "", skill: "", channel: "", groupBy: "day" });
  const [perf, setPerf] = useState<Performance | null>(null);
  const [acc, setAcc] = useState<Accuracy | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    try {
      const [p, a] = await Promise.all([
        axios.get<Performance>("/reports/performance", { params }),
        axios.get<Accuracy>("/reports/forecast-accuracy", { params }),
      ]);
      setPerf(p.data);
      setAcc(a.data);
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const importCsv = async (file: File) => {
    try {
      const csv = await file.text();
      const { data } = await axios.post("/reports/import", { csv });
      setOk(`Imported ${data.inserted} rows (${data.skippedDuplicates} duplicates skipped)`);
      setError("");
      load();
    } catch (e) {
      setOk("");
      setError(errorMessage(e));
    }
  };

  const set = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const k = perf?.summary;

  return (
    <div>
      <PageHeader title="Historical Performance" subtitle="Call volumes, answer/abandon rates, handle and wait times." />
      {error && <Alert>{error}</Alert>}
      {ok && <Alert kind="success">{ok}</Alert>}

      {canImport && (
        <Card title="Import call history (CSV)" className="mb-6">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])}
            className="text-sm"
          />
          <p className="mt-2 text-xs text-slate-400">
            Columns: interval_start, channel, skill, calls_offered, calls_answered, calls_abandoned,
            average_handle_time_sec, average_wait_time_sec. Duplicates are skipped.
          </p>
        </Card>
      )}

      <Card className="mb-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Field label="From"><input type="date" className={inputClass} value={filters.from} onChange={(e) => set("from", e.target.value)} /></Field>
          <Field label="To"><input type="date" className={inputClass} value={filters.to} onChange={(e) => set("to", e.target.value)} /></Field>
          <Field label="Skill"><input className={inputClass} value={filters.skill} onChange={(e) => set("skill", e.target.value)} placeholder="All" /></Field>
          <Field label="Channel">
            <select className={inputClass} value={filters.channel} onChange={(e) => set("channel", e.target.value)}>
              <option value="">All</option><option>Voice</option><option>Chat</option><option>Email</option>
            </select>
          </Field>
          <Field label="Group by">
            <select className={inputClass} value={filters.groupBy} onChange={(e) => set("groupBy", e.target.value)}>
              <option value="day">Day</option><option value="skill">Skill</option><option value="channel">Channel</option><option value="hour">Hour of day</option>
            </select>
          </Field>
        </div>
      </Card>

      {k && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Calls offered" value={k.offered.toLocaleString()} />
          <Stat label="Answer rate" value={k.answerRatePct === null ? "—" : `${k.answerRatePct}%`} tone="green" />
          <Stat label="Abandon rate" value={k.abandonRatePct === null ? "—" : `${k.abandonRatePct}%`} tone={k.abandonRatePct && k.abandonRatePct > 5 ? "red" : "amber"} />
          <Stat label="Avg handle / wait" value={`${k.avgHandleSec ?? "—"}s / ${k.avgWaitSec ?? "—"}s`} tone="slate" />
        </div>
      )}

      <Card title="Breakdown" className="mb-6">
        <Table
          head={[filters.groupBy, "Offered", "Answered", "Abandoned", "Abandon %", "AHT (s)", "Wait (s)"]}
          empty={!perf || perf.rows.length === 0 ? "No call history. Import a CSV above." : undefined}
        >
          {perf?.rows.map((r) => (
            <tr key={r.key}>
              <td className="px-3 py-2 font-medium">{r.key}</td>
              <td className="px-3 py-2">{r.offered}</td>
              <td className="px-3 py-2">{r.answered}</td>
              <td className="px-3 py-2">{r.abandoned}</td>
              <td className="px-3 py-2">{r.abandonRatePct ?? "—"}</td>
              <td className="px-3 py-2">{r.avgHandleSec ?? "—"}</td>
              <td className="px-3 py-2">{r.avgWaitSec ?? "—"}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Forecast vs actual">
        {acc && acc.comparedIntervals > 0 ? (
          <>
            <p className="mb-3 text-sm text-slate-600">
              {acc.comparedIntervals} intervals compared · MAE {acc.mae} · MAPE {acc.mapePct}%
            </p>
            <Table head={["Date", "Forecast", "Actual"]}>
              {acc.daily.map((d) => (
                <tr key={d.date}>
                  <td className="px-3 py-2">{d.date}</td>
                  <td className="px-3 py-2">{d.forecast}</td>
                  <td className="px-3 py-2">{d.actual}</td>
                </tr>
              ))}
            </Table>
          </>
        ) : (
          <p className="text-sm text-slate-400">{acc?.note ?? "No data yet."}</p>
        )}
        <div className="mt-3"><Button variant="secondary" onClick={load}>Refresh</Button></div>
      </Card>
    </div>
  );
};

export default ReportsPage;
