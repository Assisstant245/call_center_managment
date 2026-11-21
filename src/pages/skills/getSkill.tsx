import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { getSkillsApi } from "../../store/skills/services";

interface Skill {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const SkillsTable = () => {
  const dispatch = useDispatch();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        setError("");

        const response: any = await dispatch(
          getSkillsApi() as any
        );

        

        if (response?.payload?.data) {
          setSkills(response.payload.data);
        } else if (Array.isArray(response?.payload)) {
          setSkills(response.payload);
        } else {
          setSkills([]);
        }

      } catch (error) {
        console.error("Error loading skills:", error);
        setError("Failed to load skills");
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            Skills
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Skills available for call center agents
          </p>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* LOADING */}
          {loading && (
            <div className="p-6 text-center text-sm text-slate-500">
              Loading skills...
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="p-6 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {/* EMPTY */}
          {!loading && !error && skills.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-500">
              No skills found.
            </div>
          )}

          {/* DATA TABLE */}
          {!loading && !error && skills.length > 0 && (
            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="bg-slate-50">
                  <tr>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      ID
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Skill Name
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Description
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Created At
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">

                  {skills.map((skill) => (
                    <tr
                      key={skill.id}
                      className="hover:bg-slate-50"
                    >

                      {/* ID */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {skill.id}
                      </td>

                      {/* NAME */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">
                          {skill.name}
                        </p>
                      </td>

                      {/* DESCRIPTION */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {skill.description || "-"}
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            skill.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {skill.status}
                        </span>

                      </td>

                      {/* CREATED */}
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(
                          skill.createdAt
                        ).toLocaleDateString()}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default SkillsTable;