import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getToken, getUser, type Role } from "../helper/session";

interface Props {
  children: ReactNode;
  /** When given, only these roles may open the route. */
  roles?: Role[];
}

/** Redirects to /login when there is no session, to /home when the role is not allowed. */
const ProtectedRoute = ({ children, roles }: Props) => {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }

  if (roles) {
    const user = getUser();
    if (!user || !roles.includes(user.role)) {
      return <Navigate to="/home" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
