import type { ReactNode } from "react";

export const PageHeader = ({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) => (
  <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const Card = ({
  title,
  children,
  className = "",
  actions,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) => (
  <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
    {(title || actions) && (
      <div className="mb-4 flex items-center justify-between">
        {title && <h2 className="text-base font-semibold text-slate-800">{title}</h2>}
        {actions}
      </div>
    )}
    {children}
  </section>
);

export const Stat = ({
  label,
  value,
  tone = "blue",
}: {
  label: string;
  value: ReactNode;
  tone?: "blue" | "green" | "red" | "amber" | "slate";
}) => {
  const tones = {
    blue: "text-blue-600",
    green: "text-emerald-600",
    red: "text-red-600",
    amber: "text-amber-600",
    slate: "text-slate-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
};

const BADGE_TONES: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700",
  Accepted: "bg-sky-50 text-sky-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
  Cancelled: "bg-slate-100 text-slate-500",
  Scheduled: "bg-blue-50 text-blue-700",
  Available: "bg-emerald-50 text-emerald-700",
  OnCall: "bg-indigo-50 text-indigo-700",
  Break: "bg-amber-50 text-amber-700",
  Meeting: "bg-purple-50 text-purple-700",
  Offline: "bg-slate-100 text-slate-500",
};

export const Badge = ({ value }: { value: string }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
      BADGE_TONES[value] ?? "bg-slate-100 text-slate-600"
    }`}
  >
    {value}
  </span>
);

export const Alert = ({
  kind = "error",
  children,
}: {
  kind?: "error" | "success" | "info";
  children: ReactNode;
}) => {
  const tones = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };
  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${tones[kind]}`}>{children}</div>
  );
};

export const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "success";
  disabled?: boolean;
}) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]}`}
    >
      {children}
    </button>
  );
};

export const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
    {children}
  </label>
);

export const Table = ({
  head,
  children,
  empty,
}: {
  head: string[];
  children: ReactNode;
  empty?: string;
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
          {head.map((h) => (
            <th key={h} className="px-3 py-2 font-medium">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-slate-700">{children}</tbody>
    </table>
    {empty && <p className="py-8 text-center text-sm text-slate-400">{empty}</p>}
  </div>
);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" });

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: false });

export const todayIso = () => new Date().toISOString().slice(0, 10);
