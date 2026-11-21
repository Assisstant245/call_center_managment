
import React, { Fragment, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/store";
import { getDashboardApi } from "../../store/home/services";
import { getSkillsApi } from "../../store/skills/services";
import axios from "../../helper/api";


const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();

  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");

  // Which interval row is expanded, and the agent names loaded for it
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [roster, setRoster] = useState<Record<string, { name: string; employeeId: string }[]>>({});
  const [rosterLoading, setRosterLoading] = useState(false);

  const toggleRow = async (item: any) => {
    const key = `${item.intervalStart}|${item.skill}|${item.channel}`;
    if (openRow === key) {
      setOpenRow(null);
      return;
    }
    setOpenRow(key);
    if (roster[key]) return;

    setRosterLoading(true);
    try {
      const day = String(item.intervalStart).slice(0, 10);
      const { data } = await axios.get("/agent-schedule", {
        params: { date: day, skill: item.skill, channel: item.channel },
      });
      const wanted = new Date(item.intervalStart).getTime();
      const names = (data as any[])
        .filter((r) => new Date(r.intervalStart).getTime() === wanted)
        .map((r) => ({ name: r.agent.name, employeeId: r.agent.employeeId }));
      setRoster((prev) => ({ ...prev, [key]: names }));
    } catch {
      setRoster((prev) => ({ ...prev, [key]: [] }));
    } finally {
      setRosterLoading(false);
    }
  };

  // Dashboard data
  const { data, loading, error } = useSelector(
    (state: any) => state.dashboard.getDashboardData
  );

  // Skills data
  const { data: skillsData, loading: skillsLoading } = useSelector(
    (state: any) => state.skills.getSkillsData
  );

  // Load skills when page opens
  useEffect(() => {
    dispatch(getSkillsApi());
  }, [dispatch]);

  // Load dashboard whenever filters change
  useEffect(() => {
    dispatch(
      getDashboardApi({
        skill: selectedSkill,
        date: selectedDate,
        channel: selectedChannel,
      })
    );
  }, [
    dispatch,
    selectedSkill,
    selectedDate,
    selectedChannel,
  ]);

  // API data
  const dashboard = data || {};

  const summary = dashboard.summary || {
    forecastCalls: 0,
    requiredAgents: 0,
    availableAgents: 0,
    scheduledAgents: 0,
  };

  const intervals = dashboard.intervals || [];

  // Skills API response
  const skills = Array.isArray(skillsData)
    ? skillsData
    : skillsData?.data || [];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ================= SIDEBAR ================= */}

      {/* ================= MAIN AREA ================= */}
      <div className="ml-16 min-h-screen">

        {/* ================= NAVBAR ================= */}

        {/* ================= DASHBOARD CONTENT ================= */}
        <div className="">

          {/* Loading Dashboard */}
          {loading && (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-slate-500">
                Loading dashboard...
              </p>
            </div>
          )}

          {/* Dashboard Error */}
          {!loading && error && (
            <div className="rounded-xl bg-red-50 p-6 text-red-600">
              Failed to load dashboard data: {error}
            </div>
          )}

          {/* Dashboard */}
          {!loading && !error && (
            <>
              {/* ================= HEADER ================= */}
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-slate-900">
                  Workforce Management
                </h1>

                <p className="mt-2 text-slate-500">
                  Monitor call center performance, staffing,
                  and workforce activity.
                </p>
              </div>

              {/* ================= FILTERS ================= */}
              <div className="mb-8 rounded-xl bg-white p-5 shadow-sm">

                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Dashboard Filters
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Filter forecast and staffing data
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                  {/* Skill */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Skill
                    </label>

                    <select
                      value={selectedSkill}
                      onChange={(e) =>
                        setSelectedSkill(e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
                    >
                      <option value="">
                        {skillsLoading
                          ? "Loading Skills..."
                          : "All Skills"}
                      </option>

                      {!skillsLoading &&
                        skills
                          .filter(
                            (skill: any) =>
                              skill.status === "Active"
                          )
                          .map((skill: any) => (
                            <option
                              key={skill.id}
                              value={skill.name}
                            >
                              {skill.name}
                            </option>
                          ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Date
                    </label>

                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) =>
                        setSelectedDate(e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Channel */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Channel
                    </label>

                    <select
                      value={selectedChannel}
                      onChange={(e) =>
                        setSelectedChannel(e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
                    >
                      <option value="">
                        All Channels
                      </option>

                      <option value="Voice">
                        Voice
                      </option>

                      <option value="Chat">
                        Chat
                      </option>

                      <option value="Email">
                        Email
                      </option>
                    </select>
                  </div>

                </div>
              </div>

              {/* ================= SUMMARY CARDS ================= */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

                {/* Forecast Calls */}
                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Forecast Calls
                      </p>

                      <h2 className="mt-2 text-3xl font-bold text-slate-900">
                        {summary.forecastCalls}
                      </h2>

                      <p className="mt-2 text-sm text-slate-500">
                        Expected call volume
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-2xl">
                      ☎
                    </div>

                  </div>
                </div>

                {/* Required Agents */}
                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Required Agents
                      </p>

                      <h2 className="mt-2 text-3xl font-bold text-slate-900">
                        {summary.requiredAgents}
                      </h2>

                      <p className="mt-2 text-sm text-slate-500">
                        Agents required for forecast
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-2xl">
                      👥
                    </div>

                  </div>
                </div>

                {/* Scheduled Agents */}
                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Scheduled Agents
                      </p>

                      <h2 className="mt-2 text-3xl font-bold text-slate-900">
                        {summary.scheduledAgents}
                      </h2>

                      <p
                        className={`mt-2 text-sm ${
                          summary.scheduledAgents >=
                          summary.requiredAgents
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {summary.scheduledAgents >=
                        summary.requiredAgents
                          ? "Staffing requirement covered"
                          : `${
                              summary.requiredAgents -
                              summary.scheduledAgents
                            } agents shortage`}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-2xl">
                      ✓
                    </div>

                  </div>
                </div>

                {/* Available Agents */}
                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Available Agents
                      </p>

                      <h2 className="mt-2 text-3xl font-bold text-slate-900">
                        {summary.availableAgents}
                      </h2>

                      <p className="mt-2 text-sm text-slate-500">
                        Agents with required skill
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-2xl">
                      👤
                    </div>

                  </div>
                </div>

              </div>

              {/* ================= STAFFING TABLE ================= */}
              <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">

                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Staffing Requirements
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Forecasted calls and required staffing by interval. Click a row to see which agents are scheduled.
                  </p>
                </div>

                {intervals.length > 0 ? (
                  <div className="overflow-x-auto">

                    <table className="w-full text-left text-sm">

                      <thead>
                        <tr className="border-b border-slate-200">

                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Time
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Skill
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Channel
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Calls
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Required
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Scheduled
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Gap
                          </th>

                        </tr>
                      </thead>

                      <tbody>

                        {intervals.map(
                          (item: any, index: number) => {

                            const gap =
                              Number(
                                item.scheduledAgents || 0
                              ) -
                              Number(
                                item.requiredAgents || 0
                              );

                            const key = `${item.intervalStart}|${item.skill}|${item.channel}`;
                            const isOpen = openRow === key;
                            const names = roster[key];

                            return (
                              <Fragment key={index}>
                                <tr
                                  onClick={() => toggleRow(item)}
                                  className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                                  title="Click to see which agents are scheduled"
                                >
                                  <td className="px-4 py-3 font-medium text-slate-900">
                                    <span className="mr-2 text-xs text-slate-400">{isOpen ? "▼" : "▶"}</span>
                                    {item.time}
                                  </td>

                                  <td className="px-4 py-3 text-slate-600">{item.skill}</td>

                                  <td className="px-4 py-3 text-slate-600">{item.channel}</td>

                                  <td className="px-4 py-3 text-slate-600">{item.forecastCalls}</td>

                                  <td className="px-4 py-3 text-slate-600">{item.requiredAgents}</td>

                                  <td className="px-4 py-3 text-slate-600">{item.scheduledAgents}</td>

                                  <td
                                    className={`px-4 py-3 font-semibold ${
                                      gap < 0
                                        ? "text-red-600"
                                        : gap > 0
                                        ? "text-green-600"
                                        : "text-slate-600"
                                    }`}
                                  >
                                    {gap}
                                  </td>
                                </tr>

                                {isOpen && (
                                  <tr className="border-b border-slate-100 bg-slate-50">
                                    <td colSpan={7} className="px-6 py-4">
                                      {rosterLoading && !names ? (
                                        <p className="text-sm text-slate-400">Loading agents…</p>
                                      ) : names && names.length > 0 ? (
                                        <>
                                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                                            {names.length} agent(s) scheduled for {item.skill} · {item.channel} at {item.time} (UTC)
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {names.map((n) => (
                                              <span
                                                key={n.employeeId}
                                                className="rounded-full bg-white px-3 py-1 text-xs text-slate-700 shadow-sm ring-1 ring-slate-200"
                                              >
                                                {n.name} <span className="text-slate-400">{n.employeeId}</span>
                                              </span>
                                            ))}
                                          </div>
                                        </>
                                      ) : (
                                        <p className="text-sm text-amber-600">
                                          Nobody is scheduled for this interval yet. Use Agent Schedule → Auto-schedule day.
                                        </p>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-slate-400">
                    No staffing data available.
                  </p>
                )}

              </div>

              {/* ================= BOTTOM SECTION ================= */}
              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Upcoming Shifts */}
                <div className="rounded-xl bg-white p-6 shadow-sm">

                  <div className="flex items-center justify-between">

                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Upcoming Shifts
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Today's scheduled workforce
                      </p>
                    </div>

                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      View All
                    </button>

                  </div>

                  <div className="mt-6">
                    <p className="text-sm text-slate-500">
                      See exactly who is scheduled, by time, skill and channel, on the{" "}
                      <a href="/agentSchedule" className="font-medium text-blue-600 hover:underline">
                        Agent Schedule
                      </a>{" "}
                      page.
                    </p>
                  </div>

                </div>

                {/* Quick Actions */}
                <div className="rounded-xl bg-white p-6 shadow-sm">

                  <h2 className="text-lg font-semibold text-slate-900">
                    Quick Actions
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Frequently used workforce tools
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-4">

                    {/* Manage Agents */}
                    <button className="rounded-lg border border-slate-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50">

                      <div className="text-2xl">
                        👥
                      </div>

                      <p className="mt-3 font-medium text-slate-900">
                        Manage Agents
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Add or manage agents
                      </p>

                    </button>

                    {/* Create Schedule */}
                    <button className="rounded-lg border border-slate-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50">

                      <div className="text-2xl">
                        📅
                      </div>

                      <p className="mt-3 font-medium text-slate-900">
                        Create Schedule
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Plan agent shifts
                      </p>

                    </button>

                    {/* Forecast Calls */}
                    <button className="rounded-lg border border-slate-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50">

                      <div className="text-2xl">
                        📈
                      </div>

                      <p className="mt-3 font-medium text-slate-900">
                        Forecast Calls
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Predict call volume
                      </p>

                    </button>

                    {/* View Reports */}
                    <button className="rounded-lg border border-slate-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50">

                      <div className="text-2xl">
                        📊
                      </div>

                      <p className="mt-3 font-medium text-slate-900">
                        View Reports
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Analyze performance
                      </p>

                    </button>

                  </div>

                </div>

              </div>

            </>
          )}

        </div>
        {/* End Dashboard Content */}

      </div>
      {/* End Main Area */}

    </div>
  );
};

export default HomePage;

