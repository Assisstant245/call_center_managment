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
  Table,
  fmtDate,
  fmtTime,
  inputClass,
} from "../../components/ui";

interface ShiftRef {
  id: number;
  workDate: string;
  shift: { name: string; startTime: string; endTime: string };
}

interface Swap {
  id: number;
  status: string;
  reason: string | null;
  requesterId: number;
  targetId: number;
  requester: { name: string };
  target: { name: string };
  requesterShift: ShiftRef;
  targetShift: ShiftRef;
}

interface Candidate extends ShiftRef {
  agentId: number;
  agent: { id: number; name: string; employeeId: string };
}

const describe = (s: ShiftRef) =>
  `${fmtDate(s.workDate)} · ${s.shift.name} (${fmtTime(s.shift.startTime)}–${fmtTime(s.shift.endTime)})`;

const ShiftSwapsPage = () => {
  const isReviewer = hasRole(REVIEWER_ROLES);
  const [myAgentId, setMyAgentId] = useState<number | null>(null);
  const [myShifts, setMyShifts] = useState<ShiftRef[]>([]);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [myShiftId, setMyShiftId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get<Swap[]>("/shift-swaps");
      setSwaps(data);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    load();
    axios
      .get("/agents/me")
      .then(({ data }) => {
        setMyAgentId(data.id);
        setMyShifts(data.agentShifts ?? []);
      })
      .catch(() => setMyAgentId(null)); // users without an agent profile can still review
  }, [load]);

  useEffect(() => {
    setTargetId("");
    if (!myShiftId) {
      setCandidates([]);
      return;
    }
    axios
      .get<Candidate[]>("/shift-swaps/candidates", { params: { shiftId: myShiftId } })
      .then(({ data }) => setCandidates(data))
      .catch((e) => setError(errorMessage(e)));
  }, [myShiftId]);

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

  const request = (e: React.FormEvent) => {
    e.preventDefault();
    act(
      () =>
        axios.post("/shift-swaps", {
          requesterShiftId: Number(myShiftId),
          targetShiftId: Number(targetId),
          reason: reason || undefined,
        }),
      "Swap requested — waiting for your colleague",
    ).then(() => {
      setMyShiftId("");
      setReason("");
    });
  };

  const review = (id: number, decision: "Approved" | "Rejected") => {
    const note = window.prompt("Optional note:") ?? undefined;
    act(() => axios.patch(`/shift-swaps/${id}/review`, { decision, note: note || undefined }), `Swap ${decision.toLowerCase()}`);
  };

  return (
    <div>
      <PageHeader
        title="Shift Swaps"
        subtitle="Swap a shift with a colleague who shares a skill. Your colleague accepts first, then a manager approves."
      />
      {error && <Alert>{error}</Alert>}
      {ok && <Alert kind="success">{ok}</Alert>}

      {myAgentId !== null && (
        <Card title="Request a swap" className="mb-6">
          <form onSubmit={request} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Field label="My shift">
              <select required className={inputClass} value={myShiftId} onChange={(e) => setMyShiftId(e.target.value)}>
                <option value="">Select…</option>
                {myShifts.map((s) => (
                  <option key={s.id} value={s.id}>{describe(s)}</option>
                ))}
              </select>
            </Field>
            <Field label="Swap with">
              <select required className={inputClass} value={targetId} onChange={(e) => setTargetId(e.target.value)} disabled={!myShiftId}>
                <option value="">{myShiftId ? "Select colleague shift…" : "Pick your shift first"}</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>{c.agent.name} — {describe(c)}</option>
                ))}
              </select>
            </Field>
            <Field label="Reason">
              <input className={inputClass} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
            </Field>
            <div className="flex items-end">
              <Button type="submit" disabled={!targetId}>Request swap</Button>
            </div>
          </form>
          {myShifts.length === 0 && (
            <p className="mt-3 text-xs text-slate-400">You have no upcoming shifts assigned.</p>
          )}
        </Card>
      )}

      <Card title={isReviewer ? "All swap requests" : "My swap requests"}>
        <Table head={["Requester", "Gives", "Target", "Gets", "Status", ""]} empty={swaps.length === 0 ? "No swap requests." : undefined}>
          {swaps.map((s) => (
            <tr key={s.id}>
              <td className="px-3 py-2">{s.requester.name}</td>
              <td className="px-3 py-2 text-xs">{describe(s.requesterShift)}</td>
              <td className="px-3 py-2">{s.target.name}</td>
              <td className="px-3 py-2 text-xs">{describe(s.targetShift)}</td>
              <td className="px-3 py-2"><Badge value={s.status} /></td>
              <td className="space-x-2 px-3 py-2 text-right">
                {s.status === "Pending" && s.targetId === myAgentId && (
                  <>
                    <Button variant="success" onClick={() => act(() => axios.patch(`/shift-swaps/${s.id}/respond`, { accept: true }), "Swap accepted")}>Accept</Button>
                    <Button variant="danger" onClick={() => act(() => axios.patch(`/shift-swaps/${s.id}/respond`, { accept: false }), "Swap declined")}>Decline</Button>
                  </>
                )}
                {s.status === "Accepted" && isReviewer && (
                  <>
                    <Button variant="success" onClick={() => review(s.id, "Approved")}>Approve</Button>
                    <Button variant="danger" onClick={() => review(s.id, "Rejected")}>Reject</Button>
                  </>
                )}
                {["Pending", "Accepted"].includes(s.status) && s.requesterId === myAgentId && (
                  <Button variant="secondary" onClick={() => act(() => axios.patch(`/shift-swaps/${s.id}/cancel`), "Swap cancelled")}>Cancel</Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
};

export default ShiftSwapsPage;
