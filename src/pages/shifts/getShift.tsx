
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { getShiftsApi } from "../../store/shifts/services";

interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

const ShiftsTable: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [shifts, setShifts] =
    useState<Shift[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================
  // GET SHIFTS
  // ==========================================

 
useEffect(() => {
  const fetchShifts = async () => {
    setLoading(true);
    setError("");

    try {
      const response: any =
        await dispatch(
          getShiftsApi() as any
        );

      

      

      

      

      

      // ==============================
      // API SUCCESS
      // ==============================

      if (
        response?.meta?.requestStatus ===
        "fulfilled"
      ) {
        const shiftData =
          response?.payload?.data;

        if (
          Array.isArray(shiftData)
        ) {
          setShifts(shiftData);
        } else if (
          Array.isArray(
            response?.payload
          )
        ) {
          setShifts(response.payload);
        } else {
          setShifts([]);
        }
      }

      // ==============================
      // API FAILED
      // ==============================

      else {
        console.error(
          "GET SHIFTS FAILED:",
          response?.payload
        );

        setError(
          response?.payload ||
            "Failed to load shifts"
        );

        setShifts([]);
      }

    } catch (error) {

      console.error(
        "GET SHIFTS EXCEPTION:",
        error
      );

      setError(
        "Failed to load shifts"
      );

      setShifts([]);

    } finally {
      setLoading(false);
    }
  };

  fetchShifts();

}, [dispatch]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-500">
          Loading shifts...
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-600">
          {error}
        </p>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">

      {/* Header */}

      <div className="mb-7 flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Shifts
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage call center workforce shifts.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/shifts/create")
          }
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Create Shift
        </button>

      </div>

      {/* Table Card */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            All Shifts
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {shifts.length} shift
            {shifts.length !== 1
              ? "s"
              : ""}{" "}
            found
          </p>
        </div>

        {shifts.length === 0 ? (

          <div className="p-10 text-center">

            <p className="text-sm text-slate-500">
              No shifts found.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/shifts/create"
                )
              }
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Create your first shift
            </button>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    #
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Shift Name
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Start Time
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    End Time
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Break
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                </tr>
              </thead>

              <tbody>

                {shifts.map(
                  (shift, index) => (

                    <tr
                      key={shift.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4">

                        <p className="text-sm font-semibold text-slate-900">
                          {shift.name}
                        </p>

                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(shift.startTime).toLocaleTimeString([], { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: false }) + " UTC"}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(shift.endTime).toLocaleTimeString([], { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: false }) + " UTC"}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {shift.breakMinutes ??
                          0}{" "}
                        minutes
                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            shift.status ===
                            "Active"
                              ? "bg-green-50 text-green-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {shift.status}
                        </span>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
};

export default ShiftsTable;
