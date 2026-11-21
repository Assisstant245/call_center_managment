import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  MANAGEMENT_ROLES,
  REVIEWER_ROLES,
  getUser,
  type Role,
} from "../helper/session";

interface NavItem {
  label: string;
  icon: string;
  to?: string;
  roles?: Role[];
  children?: { label: string; to: string; icon: string; roles?: Role[] }[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", icon: "⌂", to: "/home" },
      { label: "Live Staffing", icon: "◉", to: "/live" },
    ],
  },
  {
    title: "Workforce",
    items: [
      {
        label: "Agents",
        icon: "♙",
        roles: REVIEWER_ROLES,
        children: [
          { label: "All Agents", to: "/agents", icon: "•" },
          { label: "Create Agent", to: "/agents/create", icon: "+", roles: MANAGEMENT_ROLES },
        ],
      },
      {
        label: "Skills",
        icon: "◈",
        children: [
          { label: "All Skills", to: "/skills", icon: "•" },
          { label: "Create Skill", to: "/skills/create", icon: "+", roles: MANAGEMENT_ROLES },
        ],
      },
      {
        label: "Shifts",
        icon: "◷",
        children: [
          { label: "All Shifts", to: "/shifts", icon: "•" },
          { label: "Create Shift", to: "/shifts/create", icon: "+", roles: MANAGEMENT_ROLES },
        ],
      },
      { label: "Agent Schedule", icon: "▣", to: "/agentSchedule" },
    ],
  },
  {
    title: "Planning",
    items: [{ label: "Forecast", icon: "⌁", to: "/forecast" }],
  },
  {
    title: "Requests",
    items: [
      { label: "Time Off", icon: "☀", to: "/time-off" },
      { label: "Shift Swaps", icon: "⇄", to: "/shift-swaps" },
    ],
  },
  {
    title: "Monitoring",
    items: [
      { label: "Adherence", icon: "✓", to: "/adherence" },
      { label: "Reports", icon: "▤", to: "/reports", roles: REVIEWER_ROLES },
    ],
  },
  {
    title: "Admin",
    items: [{ label: "Users & Roles", icon: "⚙", to: "/users", roles: ["admin"] }],
  },
];

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
    isActive
      ? "bg-blue-50 text-blue-600"
      : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
  }`;

const subItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-4 py-2.5 pl-12 text-sm transition-all ${
    isActive
      ? "bg-blue-50 font-medium text-blue-600"
      : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
  }`;

const Sidebar: React.FC = () => {
  const location = useLocation();
  const role = getUser()?.role;
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const allowed = (roles?: Role[]) => !roles || (!!role && roles.includes(role));

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-slate-200 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 19V10" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 19V5" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 19V8" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M22 19V3" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Workforce<span className="text-blue-600">360</span>
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Workforce Management
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {SECTIONS.map((section) => {
          const items = section.items.filter((i) => allowed(i.roles));
          if (items.length === 0) return null;

          return (
            <div key={section.title} className="mb-6">
              <p className="mb-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>

              <nav className="space-y-1">
                {items.map((item) => {
                  if (!item.children) {
                    return (
                      <NavLink key={item.label} to={item.to!} className={navItemClass}>
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  }

                  const children = item.children.filter((c) => allowed(c.roles));
                  const active = children.some((c) => c.to === location.pathname);
                  const isOpen = open[item.label] ?? active;

                  return (
                    <div key={item.label}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpen((prev) => ({ ...prev, [item.label]: !isOpen }))
                        }
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                          active
                            ? "bg-blue-50 text-blue-600"
                            : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        <span
                          className={`text-xs transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        >
                          ▼
                        </span>
                      </button>

                      {isOpen && (
                        <div className="space-y-1">
                          {children.map((child) => (
                            <NavLink key={child.to} to={child.to} end className={subItemClass}>
                              <span>{child.icon}</span>
                              <span>{child.label}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {role && (
        <div className="border-t border-slate-200 p-4 text-xs text-slate-400">
          Signed in as <span className="font-semibold capitalize text-slate-600">{role}</span>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
