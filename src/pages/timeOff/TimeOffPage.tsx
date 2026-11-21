import { useCallback, useEffect, useState } from "react";
import axios from "../../helper/api";
import { REVIEWER_ROLES, errorMessage, getUser, hasRole } from "../../helper/session";
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  PageHeader,
  Table,
  fmtDate,
  inputClass,
  todayIso,
} from "../../components/ui";

interface TimeOff {
  id: number;
  startDate: string;
  endDate: string;
  type: string;
  reason: string | null;
  status: string;
  reviewNote: string | null;
  agent: { id: number; name: string; email: string };
}

const TimeOffPage = () => {
  const isReviewer = hasRole(REVIEWER_ROLES);
  const me = getUser();
  const [rows, setRows] = useState<TimeOff[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ startDate: todayIso(), endDate: todayIso(), type: "Vacation", reason: "" });

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get<TimeOff[]>("/time-off", {
        params: { status: filter || undefined },
      });
      setRows(data);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      setOk(success);
      setError("");
      load();
    } catch (e) {
      setOk("");
      setError(errorMessage(e));
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    act(() => axios.post("/time-off", { ...form, reason: form.reason || undefined }), "Request submitted");
  };

  const review = (id: number, decision: "Approved" | "Rejected") => {
    const note = window.prompt(`Optional note for the agent (${decision.toLowerCase()}):`) ?? undefined;
    act(() => axios.patch(`/time-off/${id}/review`, { decision, note: note || undefined }), `Request ${decision.toLowerCase()}`);
  };

  return (
    <div>
      <PageHeader title="Time Off" subtitle="Request leave and track approvals." />
      {error && <Alert>{error}</Alert>}
      {ok && <Alert kind="success">{ok}</Alert>}

      <Card title="New request" className="mb-6">
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <Field label="From">
            <input type="date" required min={todayIso()} className={inputClass} value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </Field>
          <Field label="To">
            <input type="date" required min={form.startDate} className={inputClass} value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </Field>
          <Field label="Type">
            <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {["Vacation", "Sick", "Personal", "Unpaid"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Reason">
            <input className={inputClass} value={form.reason} maxLength={500}
              onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </Field>
          <div className="flex items-end">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Card>

      <Card
        title={isReviewer ? "All requests" : "My requests"}
        actions={
          <select className={`${inputClass} !w-40`} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All statuses</option>
            {["Pending", "Approved", "Rejected", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
          </select>
        }
      >
        <Table
          head={["Agent", "Dates", "Type", "Reason", "Status", ""]}
          empty={rows.length === 0 ? "No requests." : undefined}
        >
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2">{r.agent.name}</td>
              <td className="px-3 py-2">{fmtDate(r.startDate)} – {fmtDate(r.endDate)}</td>
              <td className="px-3 py-2">{r.type}</td>
              <td className="px-3 py-2 text-slate-500">
                {r.reason}
                {r.reviewNote && <span className="block text-xs text-slate-400">Note: {r.reviewNote}</span>}
              </td>
              <td className="px-3 py-2"><Badge value={r.status} /></td>
              <td className="space-x-2 px-3 py-2 text-right">
                {r.status === "Pending" && isReviewer && (
                  <>
                    <Button variant="success" onClick={() => review(r.id, "Approved")}>Approve</Button>
                    <Button variant="danger" onClick={() => review(r.id, "Rejected")}>Reject</Button>
                  </>
                )}
                {r.status === "Pending" && r.agent.email === me?.email && (
                  <Button variant="secondary" onClick={() => act(() => axios.patch(`/time-off/${r.id}/cancel`), "Request cancelled")}>
                    Cancel
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
};

export default TimeOffPage;
