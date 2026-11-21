
import React, { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { clearSession, getUser } from "../helper/session";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] =
    useState(false);

  const [userName, setUserName] =
    useState("");

  const [userRole, setUserRole] =
    useState("");

  // ==========================================
  // CHECK LOGIN STATUS
  // ==========================================

  const checkLogin = () => {
    const token =
      localStorage.getItem("token");

    const name =
      localStorage.getItem("userName");

    setIsLoggedIn(!!token);
    setUserName(name || "");
    setUserRole(getUser()?.role || "");
  };

  // ==========================================
  // CHECK LOGIN WHEN NAVBAR LOADS
  // ==========================================

  useEffect(() => {
    checkLogin();

    // For localStorage changes from another tab
    window.addEventListener(
      "storage",
      checkLogin
    );

    // For login/logout in the same tab
    window.addEventListener(
      "authChanged",
      checkLogin
    );

    return () => {
      window.removeEventListener(
        "storage",
        checkLogin
      );

      window.removeEventListener(
        "authChanged",
        checkLogin
      );
    };
  }, []);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    clearSession();

    // Update Navbar immediately
    setIsLoggedIn(false);
    setUserName("");
    setUserRole("");

    navigate("/login");
  };

  // ==========================================
  // ACTIVE LINK
  // ==========================================

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        {/* ================= LOGO ================= */}

        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-200">

            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 19V10"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="M10 19V5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="M16 19V8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="M22 19V3"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Workforce<span className="text-blue-600">
                360
              </span>
            </h1>

            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Workforce Management
            </p>
          </div>
        </Link>

        {/* ================= NAVIGATION ================= */}

        <div className="flex items-center gap-2">

          {/* HOME */}

          <Link
            to="/"
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              isActive("/")
                ? "bg-blue-50 text-blue-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
            }`}
          >
            Home
          </Link>

          {/* ================= LOGGED IN ================= */}

          {isLoggedIn ? (
            <>
              {/* DASHBOARD */}

              <Link
                to="/home"
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive("/home")
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                }`}
              >
                Dashboard
              </Link>

              <div className="ml-2">
                <NotificationBell />
              </div>

              {/* USER AREA */}

              <div className="ml-4 flex items-center gap-3 border-l border-slate-200 pl-5">

                {/* AVATAR */}

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {userName
                    ? userName
                        .charAt(0)
                        .toUpperCase()
                    : "U"}
                </div>

                {/* USER NAME */}

                <div className="hidden text-left sm:block">
                  <p className="max-w-[120px] truncate text-sm font-semibold text-slate-800">
                    {userName || "User"}
                  </p>

                  <p className="text-xs capitalize text-slate-400">
                    {userRole || "user"}
                  </p>
                </div>

                {/* LOGOUT */}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 17L15 12L10 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <path
                      d="M15 12H3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    <path
                      d="M21 19V5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>

                  Logout
                </button>

              </div>
            </>
          ) : (

            /* ================= LOGGED OUT ================= */

            <>
              {/* LOGIN */}

              <Link
                to="/login"
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-blue-600"
              >
                Login
              </Link>

              {/* SIGN UP */}

              <Link
                to="/signup"
                className="ml-1 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-md"
              >
                Get Started
              </Link>
            </>
          )}

        </div>

      </div>

    </nav>
  );
};

export default Navbar;
