
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { loginApi } from "../../store/auth/services";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    // =========================
    // VALIDATION
    // =========================

    if (!formData.email || !formData.password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    if (!formData.email.includes("@")) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    const loginData = {
      email: formData.email.trim(),
      password: formData.password,
    };

    

    setIsLoading(true);

    // =========================
    // LOGIN API
    // =========================

    dispatch(
      loginApi({
        data: loginData,

        // Login successful
      
onSuccess: () => {
  

  setIsLoading(false);

  // loginApi already saves:
  // token
  // userId
  // userName

  // Notify Navbar that login state has changed
  window.dispatchEvent(
    new Event("authChanged")
  );

  navigate("/home");
},
        // Login failed
        onError: (errorMessage: string) => {
          console.error(
            "LOGIN FAILED:",
            errorMessage
          );

          setIsLoading(false);

          setError(
            errorMessage ||
              "Invalid email or password."
          );
        },
      }) as any
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

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
            Don't have an account?

            <Link
              to="/signup"
              className="ml-2 font-semibold text-blue-400 transition hover:text-blue-300"
            >
              Sign Up
            </Link>
          </div>

        </div>
      </header>

      {/* Main */}
      <main className="relative flex min-h-[calc(100vh-81px)] items-center justify-center overflow-hidden px-6 py-12">

        {/* Background glow */}
        <div className="absolute left-1/2 top-10 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="relative grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl lg:grid-cols-2">

          {/* Left Side */}
          <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-10 lg:flex">

            <div>

              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-xl font-bold backdrop-blur">
                W
              </div>

              <h2 className="max-w-md text-4xl font-bold leading-tight">
                Welcome Back to Workforce360.
              </h2>

              <p className="mt-6 max-w-md text-lg leading-8 text-blue-100">
                Sign in to manage your call center workforce,
                monitor staffing, review forecasts, and keep
                your operations running efficiently.
              </p>

            </div>

            <div className="mt-12 space-y-5">

              <LoginFeature
                title="Call Forecasting"
                description="Understand future call demand using historical data."
              />

              <LoginFeature
                title="Smart Staffing"
                description="Monitor required and available agents."
              />

              <LoginFeature
                title="Agent Scheduling"
                description="Manage skills, shifts, and agent schedules."
              />

              <LoginFeature
                title="Real-Time Dashboard"
                description="Keep your workforce performance visible."
              />

            </div>

            <p className="mt-12 text-sm text-blue-200">
              Workforce360 • Call Center Workforce Management
            </p>

          </div>

          {/* Right Side - Login Form */}
          <div className="p-7 sm:p-10 lg:p-12">

            <div className="mb-8">

              <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                Welcome Back
              </p>

              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                Sign In
              </h2>

              <p className="mt-3 text-base leading-7 text-slate-400">
                Sign in to your Workforce360 account to continue.
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
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

              </div>

              {/* Password */}
              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-200"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
                    onClick={() => {
                      setError(
                        "Password recovery will be available soon."
                      );
                    }}
                  >
                    Forgot password?
                  </button>

                </div>

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
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3.5 pr-20 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 transition hover:text-white"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              {/* Remember me */}
              <div className="flex items-center gap-3 pt-1">

                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-slate-950 text-blue-600 focus:ring-blue-500"
                />

                <label
                  htmlFor="remember"
                  className="text-sm text-slate-400"
                >
                  Remember me
                </label>

              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? "Signing In..."
                  : "Sign In"}
              </button>

            </form>

            {/* Signup */}
            <div className="mt-8 text-center">

              <p className="text-sm text-slate-400">
                Don't have an account?

                <Link
                  to="/signup"
                  className="ml-2 font-semibold text-blue-400 transition hover:text-blue-300"
                >
                  Create Account
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

interface LoginFeatureProps {
  title: string;
  description: string;
}

const LoginFeature: React.FC<LoginFeatureProps> = ({
  title,
  description,
}) => {
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

export default LoginPage;

