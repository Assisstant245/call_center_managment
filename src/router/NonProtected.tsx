import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "../helper/session";

/** Login / signup pages: logged-in users are sent to the dashboard. */
const NonProtectedRoute = ({ children }: { children: ReactNode }) => {
  if (getToken()) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
};

export default NonProtectedRoute;
