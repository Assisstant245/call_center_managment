
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");

    setIsLoggedIn(false);

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ================= NAVBAR ================= */}
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-lg">
              W
            </div>

            <div>
              <h1 className="text-lg font-bold">
                Workforce<span className="text-blue-400">360</span>
              </h1>

              <p className="text-sm text-slate-300">
                Call Center Management
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#home"
              className="text-base text-slate-300 transition hover:text-white"
            >
              Home
            </a>

            <a
              href="#features"
              className="text-base text-slate-300 transition hover:text-white"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-base text-slate-300 transition hover:text-white"
            >
              How It Works
            </a>

            <a
              href="#about"
              className="text-base text-slate-300 transition hover:text-white"
            >
              About
            </a>
          </nav>

          {/* ================= AUTH BUTTONS ================= */}
          <div className="flex items-center gap-3">

            {!isLoggedIn ? (
              <>
                {/* Login */}
                <Link
                  to="/login"
                  className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  Login
                </Link>

                {/* Sign Up */}
                <Link
                  to="/signup"
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {/* Dashboard */}
                <Link
                  to="/dashboard"
                  className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  Dashboard
                </Link>

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
                >
                  Logout
                </button>
              </>
            )}

          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section id="home" className="relative overflow-hidden">

        {/* Background glow */}
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 py-24 lg:grid-cols-2 lg:py-32">

          {/* Left */}
          <div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-300">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Intelligent Workforce Management
            </div>

            <h2 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Manage Your Call Center

              <span className="block text-blue-400">
                Smarter & More Efficiently
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Forecast call volumes, calculate staffing requirements, manage
              agent schedules, and monitor workforce performance from one
              centralized platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">

              <Link
                to="/dashboard"
                className="rounded-xl bg-blue-600 px-7 py-3.5 font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
              >
                View Dashboard
              </Link>

              <a
                href="#features"
                className="rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Explore Features
              </a>

            </div>

            {/* Small stats */}
            <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-8">

              <div>
                <p className="text-2xl font-bold text-white">
                  24/7
                </p>

                <p className="mt-1 text-base text-slate-300">
                  Workforce Visibility
                </p>
              </div>

              <div>
                <p className="text-2xl font-bold text-white">
                  AI
                </p>

                <p className="mt-1 text-base text-slate-300">
                  Demand Forecasting
                </p>
              </div>

              <div>
                <p className="text-2xl font-bold text-white">
                  Real-Time
                </p>

                <p className="mt-1 text-base text-slate-300">
                  Insights
                </p>
              </div>

            </div>
          </div>

          {/* Right - Dashboard Preview */}
          <div className="relative">

            <div className="absolute -inset-4 rounded-3xl bg-blue-600/10 blur-2xl" />

            <div className="relative rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl">

              {/* Window header */}
              <div className="mb-6 flex items-center justify-between">

                <div>
                  <p className="text-base font-semibold text-white">
                    Workforce Dashboard
                  </p>

                  <p className="text-sm text-slate-300">
                    Today's workforce overview
                  </p>
                </div>

                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                </div>

              </div>

              {/* Dashboard cards */}
              <div className="grid grid-cols-2 gap-4">

                <DashboardCard
                  title="Forecast Calls"
                  value="1,248"
                  subtitle="Expected today"
                  icon="📞"
                />

                <DashboardCard
                  title="Required Agents"
                  value="42"
                  subtitle="Based on forecast"
                  icon="👥"
                />

                <DashboardCard
                  title="Available Agents"
                  value="38"
                  subtitle="Currently available"
                  icon="✓"
                />

                <DashboardCard
                  title="Scheduled Agents"
                  value="40"
                  subtitle="Today's schedule"
                  icon="📅"
                />

              </div>

              {/* Chart */}
              <div className="mt-5 rounded-xl border border-white/5 bg-slate-950 p-5">

                <div className="mb-5 flex items-center justify-between">

                  <div>
                    <p className="text-base font-semibold">
                      Call Volume Forecast
                    </p>

                    <p className="text-sm text-slate-300">
                      Forecast vs staffing demand
                    </p>
                  </div>

                  <span className="rounded-lg bg-blue-500/10 px-3 py-1 text-sm text-blue-400">
                    Forecast
                  </span>

                </div>

                <div className="flex h-32 items-end gap-2">

                  {[35, 50, 42, 70, 62, 85, 72, 92, 76, 100, 82, 90].map(
                    (height, index) => (
                      <div
                        key={index}
                        className="flex-1 rounded-t-md bg-blue-500/70 transition hover:bg-blue-400"
                        style={{ height: `${height}%` }}
                      />
                    )
                  )}

                </div>

                <div className="mt-3 flex justify-between text-xs text-slate-300">
                  <span>08:00</span>
                  <span>10:00</span>
                  <span>12:00</span>
                  <span>14:00</span>
                  <span>16:00</span>
                  <span>18:00</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section
        id="features"
        className="border-t border-white/10 bg-slate-900/40"
      >
        <div className="mx-auto max-w-7xl px-6 py-24">

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Powerful Features
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Everything You Need to Manage Your Workforce
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-300">
              A centralized workforce management platform designed to help
              call center managers make better staffing and scheduling
              decisions.
            </p>

          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            <FeatureCard
              icon="📊"
              title="Call Forecasting"
              description="Use historical call data to forecast future call volumes and identify demand patterns."
            />

            <FeatureCard
              icon="👥"
              title="Staffing Planning"
              description="Calculate the number of agents required based on forecasted call demand."
            />

            <FeatureCard
              icon="📅"
              title="Agent Scheduling"
              description="Create and manage agent schedules according to workforce requirements."
            />

            <FeatureCard
              icon="📈"
              title="Real-Time Dashboard"
              description="Monitor forecast calls, staffing levels, available agents, and schedules."
            />

          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how-it-works">

        <div className="mx-auto max-w-7xl px-6 py-24">

          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* Left */}
            <div>

              <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                How It Works
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                From Call History to Workforce Plan
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-300">
                Your workforce planning process becomes easier when forecasting,
                staffing, agent skills, shifts, and schedules are connected in
                one system.
              </p>

              <div className="mt-10 space-y-7">

                <Step
                  number="01"
                  title="Analyze Call History"
                  description="Historical call data is used as the foundation for workforce forecasting."
                />

                <Step
                  number="02"
                  title="Forecast Future Demand"
                  description="The forecasting service predicts expected call volume for future intervals."
                />

                <Step
                  number="03"
                  title="Calculate Staffing Requirements"
                  description="The system determines how many agents are required for the expected workload."
                />

                <Step
                  number="04"
                  title="Plan Agent Schedules"
                  description="Agents, skills, shifts, and staffing requirements are brought together for scheduling."
                />

              </div>
            </div>

            {/* Right */}
            <div className="rounded-3xl border border-white/10 bg-slate-900 p-8">

              <div className="mb-8 flex items-center justify-between">

                <div>
                  <p className="text-lg font-semibold">
                    Workforce Planning
                  </p>

                  <p className="text-base text-slate-300">
                    Planning workflow
                  </p>
                </div>

                <div className="rounded-full bg-green-400/10 px-3 py-1 text-sm text-green-400">
                  Active
                </div>

              </div>

              <div className="space-y-4">

                <WorkflowItem
                  number="1"
                  title="Call History"
                  value="Historical Data"
                  active
                />

                <WorkflowItem
                  number="2"
                  title="Forecast"
                  value="Expected Calls"
                  active
                />

                <WorkflowItem
                  number="3"
                  title="Staffing"
                  value="Required Agents"
                  active
                />

                <WorkflowItem
                  number="4"
                  title="Schedule"
                  value="Agent Shifts"
                  active
                />

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BENEFITS ================= */}
      <section
        id="about"
        className="border-y border-white/10 bg-slate-900/40"
      >

        <div className="mx-auto max-w-7xl px-6 py-24">

          <div className="grid gap-12 lg:grid-cols-2">

            <div>

              <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                Built for Operations
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Better Workforce Decisions Start With Better Visibility
              </h2>

            </div>

            <div className="grid gap-6 sm:grid-cols-2">

              <Benefit
                title="Reduce Understaffing"
                description="Identify staffing gaps before they affect workforce operations."
              />

              <Benefit
                title="Reduce Overstaffing"
                description="Align staffing requirements with expected call demand."
              />

              <Benefit
                title="Improve Planning"
                description="Give workforce planners centralized information for better decisions."
              />

              <Benefit
                title="Centralized Management"
                description="Manage agents, skills, shifts, forecasts, and schedules in one platform."
              />

            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section>

        <div className="mx-auto max-w-5xl px-6 py-24">

          <div className="relative overflow-hidden rounded-3xl border border-blue-400/20 bg-blue-600 px-8 py-16 text-center shadow-2xl shadow-blue-900/30 sm:px-16">

            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">

              <h2 className="text-3xl font-bold sm:text-4xl">
                Ready to Manage Your Workforce Smarter?
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-100">
                Bring forecasting, staffing, scheduling, and workforce
                visibility together in one centralized system.
              </p>

              <Link
                to="/dashboard"
                className="mt-8 inline-block rounded-xl bg-white px-7 py-3.5 font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Open Dashboard
              </Link>

            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/10 bg-slate-950">

        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="font-semibold">
              Workforce<span className="text-blue-400">360</span>
            </p>

            <p className="mt-1 text-sm text-slate-300">
              Call Center Workforce Management Tool
            </p>

          </div>

          <p className="text-sm text-slate-300">
            © {new Date().getFullYear()} Workforce360. All rights reserved.
          </p>

        </div>
      </footer>
    </div>
  );
};

/* =========================================================
   COMPONENTS
========================================================= */

interface DashboardCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon,
}) => {
  return (
    <div className="rounded-xl border border-white/5 bg-slate-950 p-4">

      <div className="flex items-center justify-between">

        <span className="text-xl">
          {icon}
        </span>

        <span className="text-xs text-slate-300">
          TODAY
        </span>

      </div>

      <p className="mt-4 text-sm text-slate-300">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-sm text-slate-300">
        {subtitle}
      </p>

    </div>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="group rounded-2xl border border-white/10 bg-slate-950 p-6 transition hover:-translate-y-1 hover:border-blue-400/30">

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
        {icon}
      </div>

      <h3 className="mt-6 text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-base leading-7 text-slate-300">
        {description}
      </p>

      <div className="mt-6 text-sm font-medium text-blue-400">
        Learn more →
      </div>

    </div>
  );
};

interface StepProps {
  number: string;
  title: string;
  description: string;
}

const Step: React.FC<StepProps> = ({
  number,
  title,
  description,
}) => {
  return (
    <div className="flex gap-5">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-bold text-blue-400">
        {number}
      </div>

      <div>

        <h3 className="text-lg font-semibold">
          {title}
        </h3>

        <p className="mt-1 text-base leading-7 text-slate-300">
          {description}
        </p>

      </div>
    </div>
  );
};

interface WorkflowItemProps {
  number: string;
  title: string;
  value: string;
  active?: boolean;
}

const WorkflowItem: React.FC<WorkflowItemProps> = ({
  number,
  title,
  value,
  active,
}) => {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-slate-950 p-4">

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
          active
            ? "bg-blue-500 text-white"
            : "bg-slate-800 text-slate-500"
        }`}
      >
        {number}
      </div>

      <div className="flex-1">

        <p className="text-base font-medium">
          {title}
        </p>

        <p className="text-sm text-slate-300">
          {value}
        </p>

      </div>

      {active && (
        <span className="text-green-400">
          ✓
        </span>
      )}

    </div>
  );
};

interface BenefitProps {
  title: string;
  description: string;
}

const Benefit: React.FC<BenefitProps> = ({
  title,
  description,
}) => {
  return (
    <div>

      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
        ✓
      </div>

      <h3 className="text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-base leading-7 text-slate-300">
        {description}
      </p>

    </div>
  );
};

export default LandingPage;
