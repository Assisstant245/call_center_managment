import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { createShiftApi } from "../../store/shifts/services";

interface ShiftFormData {
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: string;
  status: string;
}

const CreateShift = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();

  const [formData, setFormData] =
    useState<ShiftFormData>({
      name: "",
      startTime: "",
      endTime: "",
      breakMinutes: "",
      status: "Active",
    });

  const loading = useSelector(
    (state: any) =>
      state.shifts?.createShiftData?.loading
  );

  const error = useSelector(
    (state: any) =>
      state.shifts?.createShiftData?.error
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!formData.startTime) {
      return;
    }

    if (!formData.endTime) {
      return;
    }

    const data = {
      name: formData.name.trim(),

      startTime: `1970-01-01T${formData.startTime}:00.000Z`,

      endTime: `1970-01-01T${formData.endTime}:00.000Z`,

      breakMinutes:
        formData.breakMinutes === ""
          ? undefined
          : Number(formData.breakMinutes),

      status: formData.status,
    };

    
    

    dispatch(
      createShiftApi({
        data,

        onSuccess: () => {
          

          navigate("/shifts");
        },

        onError: () => {
          
        },
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      {/* Header */}

      <div className="mx-auto mb-7 max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/shifts")}
          className="mb-4 text-sm font-medium text-slate-500 transition hover:text-blue-600"
        >
          ← Back to Shifts
        </button>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Create Shift
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Add a new shift to the call center
          workforce management system.
        </p>
      </div>

      {/* Form Card */}

      <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Shift Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the shift name, working hours,
              break duration and status.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Shift Name */}

              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Shift Name
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
                  placeholder="e.g. Morning Shift"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Status */}

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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>

              {/* Start Time */}

              <div>
                <label
                  htmlFor="startTime"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Start Time
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* End Time */}

              <div>
                <label
                  htmlFor="endTime"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  End Time
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Break */}

              <div className="md:col-span-2">
                <label
                  htmlFor="breakMinutes"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Break Duration
                </label>

                <div className="relative">
                  <input
                    id="breakMinutes"
                    name="breakMinutes"
                    type="number"
                    min="0"
                    value={formData.breakMinutes}
                    onChange={handleChange}
                    placeholder="e.g. 60"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-20 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    minutes
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Enter the total break duration in
                  minutes.
                </p>
              </div>
            </div>
          </div>

          {/* Error */}

          {error && (
            <div className="mx-6 mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Buttons */}

          <div className="flex items-center justify-end gap-3 p-6">
            <button
              type="button"
              onClick={() => navigate("/shifts")}
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
                : "Create Shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateShift;