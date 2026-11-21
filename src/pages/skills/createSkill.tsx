import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createSkillApi } from "../../store/skills/services";

interface SkillFormData {
  name: string;
  description: string;
  status: string;
}

const CreateSkill = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();

  const [formData, setFormData] = useState<SkillFormData>({
    name: "",
    description: "",
    status: "Active",
  });

  const loading = useSelector(
    (state: any) => state.skills?.createSkillData?.loading
  );

  const error = useSelector(
    (state: any) => state.skills?.createSkillData?.error
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault();

  try {
    await dispatch(
      createSkillApi({
        name: formData.name,
        description: formData.description || undefined,
        status: formData.status,
      })
    ).unwrap();

    navigate("/skills");
  } catch {
    // the error is shown by the skills slice state
  }
};

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">

      {/* Header */}
      <div className="mx-auto mb-7 max-w-5xl">

        <button
          type="button"
          onClick={() => navigate("/skills")}
          className="mb-4 text-sm font-medium text-slate-500 transition hover:text-blue-600"
        >
          ← Back to Skills
        </button>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Create Skill
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Add a new skill to the call center workforce management system.
        </p>
      </div>

      {/* Form Card */}
      <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white shadow-sm">

        <form onSubmit={handleSubmit}>

          {/* Skill Information */}
          <div className="border-b border-slate-200 p-6">

            <h2 className="text-lg font-semibold text-slate-900">
              Skill Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the skill name, description and status.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Skill Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Skill Name
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Customer Support"
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
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter skill description"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 p-6">

            <button
              type="button"
              onClick={() => navigate("/skills")}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Skill"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateSkill;