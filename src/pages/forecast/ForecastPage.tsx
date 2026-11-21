import { useCallback, useEffect, useState } from "react";
import axios from "../../helper/api";
import { MANAGEMENT_ROLES, errorMessage, hasRole } from "../../helper/session";
import {
  Alert,
  Button,
  Card,
  Field,
  PageHeader,
  Table,
  fmtTime,
  inputClass,
} from "../../components/ui";

interface Skill {
  id: number;
  name: string;
}

interface Series {
  skill: string;
  channel: string;
  rows: number;
  accuracy: { mae: number | null; mape: number | null } | null;
  error?: string;
}

interface MultiChannel {
  totals: Record<string, { calls: number; peakAgents: number }>;
  intervals: {
    intervalStart: string;
    channels: Record<string, { calls: number; requiredAgents: number }>;
    totalCalls: number;
    totalRequiredAgents: number;
  }[];
}

const CHANNELS = ["Voice", "Chat", "Email"];

const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

const ForecastPage = () => {
  const canManage = hasRole(MANAGEMENT_ROLES);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skill, setSkill] = useState("");
  const [date, setDate] = useState(tomorrow());
  const [multi, setMulti] = useState<MultiChannel | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [series, setSeries] = useState<Series[]>([]);
  const [gen, setGen] = useState({ skill: "", channel: "", startDate: tomorrow(), withAccuracy: false });

  useEffect(() => {
    axios
      .get("/skills")
      .then((r) => setSkills(r.data.data ?? []))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get<MultiChannel>("/forecast/multi-channel", {
        params: { skill: skill || undefined, date },
      });
      setMulti(data);
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [skill, date]);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async () => {
    setBusy(true);
    setInfo("");
    setError("");
    try {
      const { data } = await axios.post("/forecast/generate", {
        skill: gen.skill || undefined,
        channel: gen.channel || undefined,
        startDate: gen.startDate,
        withAccuracy: gen.withAccuracy,
      });
      setSeries(data.series);
      setInfo(`Generated ${data.generatedRows} forecast intervals.`);
      setDate(gen.startDate);
      if (gen.skill) setSkill(gen.skill);
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Demand Forecast"
        subtitle="Prophet call-volume forecast converted to required agents with Erlang C — per skill and channel."
      />

      {error && <Alert>{error}</Alert>}
      {info && <Alert kind="success">{info}</Alert>}

      {canManage && (
        <Card title="Generate forecast" className="mb-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Field label="Skill">
              <select
                className={inputClass}
                value={gen.skill}
                onChange={(e) => setGen({ ...gen, skill: e.target.value })}
              >
                <option value="">All active skills</option>
                {skills.map((s) => (
                  <option key={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Channel">
              <select
                className={inputClass}
                value={gen.channel}
                onChange={(e) => setGen({ ...gen, channel: e.target.value })}
              >
                <option value="">All channels</option>
                {CHANNELS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Forecast day (UTC)">
              <input
                type="date"
                className={inputClass}
                value={gen.startDate}
                onChange={(e) => setGen({ ...gen, startDate: e.target.value })}
              />
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={gen.withAccuracy}
                onChange={(e) => setGen({ ...gen, withAccuracy: e.target.checked })}
              />
              Measure accuracy (slower)
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={generate} disabled={busy}>
              {busy ? "Forecasting…" : "Generate forecast"}
            </Button>
            <span className="text-xs text-slate-400">
              Needs call history (Reports → Import) and the forecasting service running.
            </span>
          </div>

          {series.length > 0 && (
            <div className="mt-5">
              <Table head={["Skill", "Channel", "Intervals", "MAE", "MAPE %", "Note"]}>
                {series.map((s) => (
                  <tr key={`${s.skill}|${s.channel}`}>
                    <td className="px-3 py-2">{s.skill}</td>
                    <td className="px-3 py-2">{s.channel}</td>
                    <td className="px-3 py-2">{s.rows}</td>
                    <td className="px-3 py-2">{s.accuracy?.mae ?? "—"}</td>
                    <td className="px-3 py-2">{s.accuracy?.mape ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-red-500">{s.error ?? ""}</td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
        </Card>
      )}

      <Card title="Multi-channel demand" className="mb-6">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label="Skill">
            <select className={inputClass} value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="">All skills</option>
              {skills.map((s) => (
                <option key={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Date (UTC)">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        {multi && Object.keys(multi.totals).length > 0 && (
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {CHANNELS.filter((c) => multi.totals[c]).map((c) => (
              <div key={c} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-400">{c}</p>
                <p className="text-2xl font-bold text-slate-800">{multi.totals[c].calls} contacts</p>
                <p className="text-xs text-slate-500">Peak {multi.totals[c].peakAgents} agents</p>
              </div>
            ))}
          </div>
        )}

        <Table
          head={["Time (UTC)", ...CHANNELS.map((c) => `${c} (calls / agents)`), "Total agents"]}
          empty={!multi || multi.intervals.length === 0 ? "No forecast for this day." : undefined}
        >
          {multi?.intervals.map((i) => (
            <tr key={i.intervalStart}>
              <td className="px-3 py-2 font-medium">{fmtTime(i.intervalStart)}</td>
              {CHANNELS.map((c) => (
                <td key={c} className="px-3 py-2">
                  {i.channels[c] ? `${i.channels[c].calls} / ${i.channels[c].requiredAgents}` : "—"}
                </td>
              ))}
              <td className="px-3 py-2 font-semibold">{i.totalRequiredAgents}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
};

export default ForecastPage;
