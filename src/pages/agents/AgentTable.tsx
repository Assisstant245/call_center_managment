
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { getAgentsApi } from "../../store/agents/Services";

interface AgentSkill {
  skill?: {
    id: number;
    name: string;
    status?: string;
  };
}

interface AgentShift {
  shift?: {
    id: number;
    name: string;
    status?: string;
  };
  workDate?: string;
}

interface Agent {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  hireDate?: string | null;

  agentSkills?: AgentSkill[];

  agentShifts?: AgentShift[];
}

const AgentTable = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ==========================================
  // LOCAL STATE
  // ==========================================

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // GET AGENTS
  // ==========================================

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        setError("");

        const response: any = await dispatch(
          getAgentsApi() as any
        );

        

        // Backend response:
        // {
        //   status: "success",
        //   data: [...]
        // }

        if (Array.isArray(response?.payload?.data)) {
          setAgents(response.payload.data);
        }

        // In case API directly returns an array
        else if (Array.isArray(response?.payload)) {
          setAgents(response.payload);
        }

        else {
          setAgents([]);
        }

      } catch (error) {
        console.error(
          "Error loading agents:",
          error
        );

        setError("Failed to load agents");

      } finally {
        setLoading(false);
      }
    };

    fetchAgents();

  }, [dispatch]);

  // ==========================================
  // AGENT COUNTS
  // ==========================================

  const onlineAgents = agents.filter(
    (agent) => agent.status === "Online"
  ).length;

  const offlineAgents = agents.filter(
    (agent) => agent.status === "Offline"
  ).length;

  const busyAgents = agents.filter(
    (agent) => agent.status === "Busy"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">

      {/* ================= HEADER ================= */}

      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Agents
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage and monitor your call center agents
          </p>

        </div>

        <button
          onClick={() => navigate("/agents/create")}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <span className="text-lg leading-none">
            +
          </span>

          Add Agent

        </button>

      </div>

      {/* ================= STAT CARDS ================= */}

      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* TOTAL */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-xl">
              👥
            </div>

            <div>

              <p className="text-sm font-medium text-slate-500">
                Total Agents
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {agents.length}
              </p>

            </div>

          </div>

        </div>

        {/* ONLINE */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50">

              <span className="h-3 w-3 rounded-full bg-emerald-500" />

            </div>

            <div>

              <p className="text-sm font-medium text-slate-500">
                Online
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {onlineAgents}
              </p>

            </div>

          </div>

        </div>

        {/* OFFLINE */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100">

              <span className="h-3 w-3 rounded-full bg-slate-400" />

            </div>

            <div>

              <p className="text-sm font-medium text-slate-500">
                Offline
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {offlineAgents}
              </p>

            </div>

          </div>

        </div>

        {/* BUSY */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50">

              <span className="h-3 w-3 rounded-full bg-orange-500" />

            </div>

            <div>

              <p className="text-sm font-medium text-slate-500">
                Busy
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {busyAgents}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ================= TABLE CARD ================= */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* TABLE HEADER */}

        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h2 className="text-lg font-semibold text-slate-900">
              Agent List
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View all registered call center agents
            </p>

          </div>

          {/* SEARCH */}

          <div className="flex w-full gap-2 sm:w-auto">

            <div className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 sm:w-64 sm:flex-none">

              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.04 6.04a7.5 7.5 0 0 0 10.61 10.61Z"
                />

              </svg>

              <input
                type="text"
                placeholder="Search agents..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />

            </div>

            <button
              className="
                inline-flex h-10 items-center gap-2
                rounded-lg border border-slate-200
                bg-white px-4
                text-sm font-medium text-slate-600
                transition hover:bg-slate-50
              "
            >

              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h18M6 12h12m-9 7h6"
                />

              </svg>

              Filter

            </button>

          </div>

        </div>

        {/* ================= LOADING ================= */}

        {loading && (

          <div className="p-10 text-center">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-slate-500">
              Loading agents...
            </p>

          </div>

        )}

        {/* ================= ERROR ================= */}

        {!loading && error && (

          <div className="p-10 text-center">

            <div className="text-2xl">
              ⚠️
            </div>

            <p className="mt-2 text-sm font-medium text-red-600">
              {error}
            </p>

          </div>

        )}

        {/* ================= EMPTY ================= */}

        {!loading &&
          !error &&
          agents.length === 0 && (

            <div className="p-10 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                👥
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-800">
                No agents found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                There are currently no agents registered.
              </p>

            </div>
          )}

        {/* ================= DATA TABLE ================= */}

        {!loading &&
          !error &&
          agents.length > 0 && (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1100px]">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Agent
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Employee ID
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Email
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Phone
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Skills
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Shift
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Hire Date
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {agents.map((agent) => (

                    <tr
                      key={agent.id}
                      className="transition hover:bg-slate-50"
                    >

                      {/* AGENT */}

                      <td className="whitespace-nowrap px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                            {agent.name
                              ?.charAt(0)
                              .toUpperCase() || "A"}
                          </div>

                          <div>

                            <p className="font-semibold text-slate-800">
                              {agent.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              Agent #{agent.id}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* EMPLOYEE ID */}

                      <td className="whitespace-nowrap px-5 py-4">

                        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {agent.employeeId}
                        </span>

                      </td>

                      {/* EMAIL */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {agent.email}
                      </td>

                      {/* PHONE */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {agent.phone || "-"}
                      </td>

                      {/* SKILLS */}

                      <td className="px-5 py-4">

                        {agent.agentSkills &&
                        agent.agentSkills.length > 0 ? (

                          <div className="flex max-w-[230px] flex-wrap gap-1.5">

                            {agent.agentSkills
                              .slice(0, 3)
                              .map(
                                (
                                  agentSkill,
                                  index
                                ) => (

                                  <span
                                    key={index}
                                    className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600"
                                  >
                                    {agentSkill.skill
                                      ?.name || "-"}
                                  </span>

                                )
                              )}

                            {agent.agentSkills.length >
                              3 && (

                              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">

                                +
                                {agent.agentSkills.length -
                                  3}

                              </span>

                            )}

                          </div>

                        ) : (

                          <span className="text-xs text-slate-400">
                            No skills
                          </span>

                        )}

                      </td>

                      {/* STATUS */}

                      <td className="whitespace-nowrap px-5 py-4">

                        {agent.status ===
                          "Online" && (

                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">

                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                            Online

                          </span>

                        )}

                        {agent.status ===
                          "Offline" && (

                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">

                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />

                            Offline

                          </span>

                        )}

                        {agent.status === "Busy" && (

                          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">

                            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />

                            Busy

                          </span>

                        )}

                      </td>

                      {/* SHIFT */}

                      <td className="whitespace-nowrap px-5 py-4">

                        {agent.agentShifts &&
                        agent.agentShifts.length > 0 ? (

                          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">

                            {agent.agentShifts[0]?.shift
                              ?.name || "-"}

                          </span>

                        ) : (

                          <span className="text-sm text-slate-400">
                            -
                          </span>

                        )}

                      </td>

                      {/* HIRE DATE */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">

                        {agent.hireDate
                          ? new Date(
                              agent.hireDate
                            ).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "-"}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        {/* ================= FOOTER ================= */}

        {!loading &&
          !error &&
          agents.length > 0 && (

            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">

              <p className="text-xs text-slate-500">

                Showing{" "}

                <span className="font-semibold text-slate-700">
                  {agents.length}
                </span>{" "}

                agents

              </p>

            </div>

          )}

      </div>

    </div>
  );
};

export default AgentTable;
