import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { createAgentApi } from "../../store/agents/Services";
import { getSkillsApi } from "../../store/skills/services";
import { getShiftsApi } from "../../store/shifts/services";

interface Skill {
  id: number;
  name: string;
  description?: string;
  status: string;
}

interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  status: string;
}

interface AgentFormData {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  hireDate: string;
  skillIds: number[];
  shiftId: number | "";
  workDate: string;
}

const CreateAgent = () => {
  const navigate = useNavigate();

  // Redux dispatch
  const dispatch = useDispatch<any>();

  // ==========================================
  // FORM DATA
  // ==========================================

  const [formData, setFormData] = useState<AgentFormData>({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    status: "Offline",
    hireDate: "",
    skillIds: [],
    shiftId: "",
    workDate: "",
  });

  // ==========================================
  // SKILLS / SHIFTS
  // ==========================================

  const [skills, setSkills] = useState<Skill[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const [loadingSkills, setLoadingSkills] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(false);

  const [dataError, setDataError] = useState("");

  // ==========================================
  // AGENT REDUX STATE
  // ==========================================

  const loading = useSelector(
    (state: any) => state.agents.createAgentData.loading
  );

  const error = useSelector(
    (state: any) => state.agents.createAgentData.error
  );

  // ==========================================
  // GET SKILLS AND SHIFTS
  // ==========================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingSkills(true);
        setLoadingShifts(true);
        setDataError("");

        // IMPORTANT:
        // createAsyncThunk must be dispatched
        const [skillsResponse, shiftsResponse] = await Promise.all([
          dispatch(getSkillsApi()).unwrap(),
          dispatch(getShiftsApi()).unwrap(),
        ]);

        
        

        // Backend should return arrays
        setSkills(
          Array.isArray(skillsResponse)
            ? skillsResponse
            : skillsResponse?.data || []
        );

        setShifts(
          Array.isArray(shiftsResponse)
            ? shiftsResponse
            : shiftsResponse?.data || []
        );
      } catch (error: any) {
        console.error(
          "Error loading skills/shifts:",
          error
        );

        console.error(
          "Skills/Shifts backend error:",
          error?.response?.data || error
        );

        setDataError(
          typeof error === "string"
            ? error
            : error?.message ||
                "Unable to load skills and shifts."
        );
      } finally {
        setLoadingSkills(false);
        setLoadingShifts(false);
      }
    };

    loadData();
  }, [dispatch]);

  // ==========================================
  // HANDLE CHANGE
  // ==========================================

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        name === "shiftId"
          ? value
            ? Number(value)
            : ""
          : value,
    }));
  };

  // ==========================================
  // SELECT / UNSELECT SKILL
  // ==========================================

  const toggleSkill = (skillId: number) => {
    setFormData((previous) => {
      const alreadySelected =
        previous.skillIds.includes(skillId);

      return {
        ...previous,
        skillIds: alreadySelected
          ? previous.skillIds.filter(
              (id) => id !== skillId
            )
          : [...previous.skillIds, skillId],
      };
    });
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    

    // ==========================================
    // CREATE AGENT PAYLOAD
    // ==========================================

    const payload = {
      employeeId: formData.employeeId,
      name: formData.name,
      email: formData.email,

      phone: formData.phone || undefined,

      status: formData.status,

      hireDate:
        formData.hireDate || undefined,

      // Skill IDs from database
      skillIds: formData.skillIds,

      // Shift ID from database
      shiftId:
        formData.shiftId === ""
          ? undefined
          : formData.shiftId,

      workDate:
        formData.workDate || undefined,
    };

    

    // ==========================================
    // CREATE AGENT API
    // ==========================================

    dispatch(
      createAgentApi({
        data: payload,

        onSuccess: () => {
          

          navigate("/agents");
        },

        onError: (error: string) => {
          console.error(
            "Error creating agent:",
            error
          );
        },
      })
    );
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50 ">

      {/* Header */}
      <div className="mx-auto mb-7 max-w-5xl">

        <button
          type="button"
          onClick={() => navigate("/agents")}
          className="mb-4 text-sm font-medium text-slate-500 transition hover:text-blue-600"
        >
          ← Back to Agents
        </button>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Create Agent
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Add a new call center agent to the
          workforce management system.
        </p>

      </div>

      {/* Form Card */}
      <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white shadow-sm">

        <form onSubmit={handleSubmit}>

          {/* ========================= */}
          {/* BASIC INFORMATION */}
          {/* ========================= */}

          <div className="border-b border-slate-200 p-6">

            <h2 className="text-lg font-semibold text-slate-900">
              Basic Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the agent's basic employee
              information.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Employee ID */}
              <div>

                <label
                  htmlFor="employeeId"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Employee ID
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. EMP-001"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* Name */}
              <div>

                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Full Name
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* Email */}
              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email Address
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="agent@example.com"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* Phone */}
              <div>

                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+92 300 1234567"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>
          </div>

          {/* ========================= */}
          {/* WORKFORCE INFORMATION */}
          {/* ========================= */}

          <div className="border-b border-slate-200 p-6">

            <h2 className="text-lg font-semibold text-slate-900">
              Workforce Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure the agent's skills,
              status and work schedule.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* STATUS */}
              <div>

                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Offline">
                    Offline
                  </option>

                  <option value="Online">
                    Online
                  </option>

                  <option value="Busy">
                    Busy
                  </option>

                  <option value="Away">
                    Away
                  </option>
                </select>

              </div>

              {/* SHIFT */}
              <div>

                <label
                  htmlFor="shiftId"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Shift
                </label>

                <select
                  id="shiftId"
                  name="shiftId"
                  value={formData.shiftId}
                  onChange={handleChange}
                  disabled={loadingShifts}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                >

                  <option value="">
                    {loadingShifts
                      ? "Loading shifts..."
                      : "Select Shift"}
                  </option>

                  {shifts.map((shift) => (
                    <option
                      key={shift.id}
                      value={shift.id}
                    >
                      {shift.name}
                    </option>
                  ))}

                </select>

              </div>

              {/* HIRE DATE */}
              <div>

                <label
                  htmlFor="hireDate"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Hire Date
                </label>

                <input
                  id="hireDate"
                  name="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* WORK DATE */}
              <div>

                <label
                  htmlFor="workDate"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Work Date
                </label>

                <input
                  id="workDate"
                  name="workDate"
                  type="date"
                  value={formData.workDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* ========================= */}
              {/* SKILLS */}
              {/* ========================= */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Skills
                </label>

                {loadingSkills ? (

                  <p className="text-sm text-slate-500">
                    Loading skills...
                  </p>

                ) : skills.length === 0 ? (

                  <p className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                    No active skills found.
                  </p>

                ) : (

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">

                    {skills.map((skill) => {

                      const selected =
                        formData.skillIds.includes(
                          skill.id
                        );

                      return (
                        <label
                          key={skill.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                            selected
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 bg-white hover:border-blue-300"
                          }`}
                        >

                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              toggleSkill(skill.id)
                            }
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />

                          <div>

                            <p className="text-sm font-medium text-slate-700">
                              {skill.name}
                            </p>

                            {skill.description && (
                              <p className="text-xs text-slate-400">
                                {skill.description}
                              </p>
                            )}

                          </div>

                        </label>
                      );
                    })}

                  </div>
                )}

              </div>

            </div>
          </div>

          {/* ========================= */}
          {/* ERROR */}
          {/* ========================= */}

          {(error || dataError) && (
            <div className="mx-6 mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {dataError || error}
            </div>
          )}

          {/* ========================= */}
          {/* ACTIONS */}
          {/* ========================= */}

          <div className="flex items-center justify-end gap-3 p-6">

            <button
              type="button"
              onClick={() => navigate("/agents")}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating..."
                : "Create Agent"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateAgent;