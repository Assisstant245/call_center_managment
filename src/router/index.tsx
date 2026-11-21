import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import HomeSwitch from "../pages/Home/HomeSwitch";
import AgentPage from "../pages/agents/Index";
import CreateAgent from "../pages/agents/createAgent";
import CreateSkill from "../pages/skills/createSkill";
import CreateShift from "../pages/shifts/createShift";
import SkillsTable from "../pages/skills/getSkill";
import ShiftsTable from "../pages/shifts/getShift";
import AgentSchedule from "../pages/agentSchedule/AgentSchedule";
import LiveDashboard from "../pages/liveDashboard/LiveDashboard";
import ForecastPage from "../pages/forecast/ForecastPage";
import TimeOffPage from "../pages/timeOff/TimeOffPage";
import ShiftSwapsPage from "../pages/shiftSwaps/ShiftSwapsPage";
import AdherencePage from "../pages/adherence/AdherencePage";
import ReportsPage from "../pages/reports/ReportsPage";
import UsersPage from "../pages/users/UsersPage";

import LandingPage from "../pages/landingPage/LandingPage";
import SignupPage from "../pages/auth/SignUp";
import LoginPage from "../pages/auth/Login";

import DashboardLayout from "../layout/DashboardLayout";
import ProtectedRoute from "./Protected";
import NonProtectedRoute from "./NonProtected";
import {
  MANAGEMENT_ROLES,
  REVIEWER_ROLES,
} from "../helper/session";

const manage = MANAGEMENT_ROLES;
const review = REVIEWER_ROLES;

const router = createBrowserRouter([
  // ---------------- public pages ----------------
  { path: "/", element: <LandingPage /> },
  { path: "/landingpage", element: <LandingPage /> },
  {
    path: "/login",
    element: (
      <NonProtectedRoute>
        <LoginPage />
      </NonProtectedRoute>
    ),
  },
  {
    path: "/signup",
    element: (
      <NonProtectedRoute>
        <SignupPage />
      </NonProtectedRoute>
    ),
  },

  // ---------------- app (needs login) ----------------
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/home", element: <HomeSwitch /> },
      { path: "/dashboard", element: <Navigate to="/home" replace /> },
      { path: "/live", element: <LiveDashboard /> },

      // master data
      {
        path: "/agents",
        element: (
          <ProtectedRoute roles={review}>
            <AgentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/agents/create",
        element: (
          <ProtectedRoute roles={manage}>
            <CreateAgent />
          </ProtectedRoute>
        ),
      },
      { path: "/skills", element: <SkillsTable /> },
      {
        path: "/skills/create",
        element: (
          <ProtectedRoute roles={manage}>
            <CreateSkill />
          </ProtectedRoute>
        ),
      },
      { path: "/shifts", element: <ShiftsTable /> },
      {
        path: "/shifts/create",
        element: (
          <ProtectedRoute roles={manage}>
            <CreateShift />
          </ProtectedRoute>
        ),
      },

      // planning
      { path: "/forecast", element: <ForecastPage /> },
      { path: "/agentSchedule", element: <AgentSchedule /> },

      // requests & monitoring
      { path: "/time-off", element: <TimeOffPage /> },
      { path: "/shift-swaps", element: <ShiftSwapsPage /> },
      { path: "/adherence", element: <AdherencePage /> },
      {
        path: "/reports",
        element: (
          <ProtectedRoute roles={review}>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/users",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);

export const WebRouter = () => <RouterProvider router={router} />;
