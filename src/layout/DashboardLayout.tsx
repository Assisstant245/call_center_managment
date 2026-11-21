
import React from "react";
import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <Navbar />

      {/* Sidebar */}
      <Sidebar />

      {/* Page Content */}
      <main className="ml-64 pt-16">
        <div className="p-6">
          <Outlet />
        </div>
      </main>

    </div>
  );
};

export default DashboardLayout;
