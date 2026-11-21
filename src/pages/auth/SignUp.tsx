
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { signupApi } from "../../store/auth/services";

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // HANDLE INPUT CHANGE
  // =========================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // =========================
  // HANDLE SIGNUP
  // =========================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    // Prevent multiple submissions
    if (loading) {
      return;
    }

    // =========================
    // FRONTEND VALIDATION
    // =========================

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    // =========================
    // DATA SENT TO BACKEND
    // =========================

    const signupData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
    };

    

    setLoading(true);

    // =========================
    // REDUX SIGNUP API
    // =========================

    dispatch(
      signupApi({
        data: signupData,

        // SUCCESS
        onSuccess: () => {
          

          setLoading(false);

          navigate("/login");
        },

        // ERROR
        onError: (errorMessage: string) => {
          console.error(
            "SIGNUP FAILED:",
            errorMessage
          );

          setLoading(false);

          setError(
            errorMessage ||
              "Unable to create account. Please try again."
          );
        },
      }) as any
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ================= HEADER ================= */}
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold shadow-lg shadow-blue-600/20">
              W
            </div>

            <div>
              <h1 className="text-lg font-bold">
                Workforce
                <span className="text-blue-400">
                  360
                </span>
              </h1>

              <p className="text-xs text-slate-400">
                Call Center Management
              </p>
            </div>
          </Link>

          <div className="hidden text-sm text-slate-400 sm:block">
            Already have an account?

            <Link
              to="/login"
              className="ml-2 font-semibold text-blue-400 transition hover:text-blue-300"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* ================= SIGNUP AREA ================= */}
      <main className="relative flex min-h-[calc(100vh-81px)] items-center justify-center overflow-hidden px-6 py-12">
        {/* Background Glow */}
        <div className="absolute left-1/2 top-10 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="relative grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl lg:grid-cols-2">
          {/* ================= LEFT SIDE ================= */}
          <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-10 lg:flex">
            <div>
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-xl font-bold backdrop-blur">
                W
              </div>

              <h2 className="max-w-md text-4xl font-bold leading-tight">
                Smarter Workforce Management
                Starts Here.
              </h2>

              <p className="mt-6 max-w-md text-lg leading-8 text-blue-100">
                Create your Workforce360 account
                and bring forecasting, staffing,
                scheduling, and workforce
                visibility together in one
                centralized platform.
              </p>
            </div>

            {/* Features */}
            <div className="mt-12 space-y-5">
              <SignupFeature
                title="Call Forecasting"
                description="Predict future call demand using historical data."
              />

              <SignupFeature
                title="Smart Staffing"
                description="Know how many agents are required for each interval."
              />

              <SignupFeature
                title="Agent Scheduling"
                description="Manage agents, skills, shifts, and schedules."
              />

              <SignupFeature
                title="Real-Time Visibility"
                description="Monitor your workforce from one dashboard."
              />
            </div>

            <p className="mt-12 text-sm text-blue-200">
              Workforce360 • Call Center Workforce
              Management
            </p>
          </div>

          {/* ================= RIGHT SIDE ================= */}
          <div className="p-7 sm:p-10 lg:p-12">
            {/* Heading */}
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                Get Started
              </p>

              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                Create Your Account
              </h2>

              <p className="mt-3 text-base leading-7 text-slate-400">
                Join Workforce360 and start
                managing your workforce smarter.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Full Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Full Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3.5 pr-20 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Confirm Password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      formData.confirmPassword
                    }
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3.5 pr-20 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  required
                  disabled={loading}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                />

                <p className="text-sm leading-6 text-slate-400">
                  I agree to the{" "}
                  <button
                    type="button"
                    className="font-medium text-blue-400 hover:text-blue-300"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="font-medium text-blue-400 hover:text-blue-300"
                  >
                    Privacy Policy
                  </button>
                  .
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue-600"
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
              </button>
            </form>

            {/* Login */}
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-400">
                Already have an account?

                <Link
                  to="/login"
                  className="ml-2 font-semibold text-blue-400 transition hover:text-blue-300"
                >
                  Login
                </Link>
              </p>
            </div>

            {/* Back */}
            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-sm text-slate-500 transition hover:text-slate-300"
              >
                ← Back to Workforce360
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

/* =========================================================
   SIGNUP FEATURE
========================================================= */

interface SignupFeatureProps {
  title: string;
  description: string;
}

const SignupFeature: React.FC<
  SignupFeatureProps
> = ({ title, description }) => {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-sm">
        ✓
      </div>

      <div>
        <h3 className="font-semibold text-white">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-blue-100">
          {description}
        </p>
      </div>
    </div>
  );
};

export default SignupPage;

