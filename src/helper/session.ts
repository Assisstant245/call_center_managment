// Small helpers around the login session stored in localStorage.

export type Role = "admin" | "manager" | "planner" | "supervisor" | "agent";

export const MANAGEMENT_ROLES: Role[] = ["admin", "manager", "planner"];
export const REVIEWER_ROLES: Role[] = [...MANAGEMENT_ROLES, "supervisor"];

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export const getToken = (): string | null => {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

export const getUser = (): SessionUser | null => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
};

export const saveSession = (token: string, user: SessionUser) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  // kept for older components
  localStorage.setItem("userId", String(user.id));
  localStorage.setItem("userName", user.name);
  window.dispatchEvent(new Event("authChanged"));
};

export const clearSession = () => {
  ["token", "user", "userId", "userName"].forEach((k) =>
    localStorage.removeItem(k),
  );
  window.dispatchEvent(new Event("authChanged"));
};

export const hasRole = (roles: Role[]): boolean => {
  const user = getUser();
  return !!user && roles.includes(user.role);
};

/** Extracts a readable message from an axios error. */
export const errorMessage = (error: unknown, fallback = "Something went wrong"): string => {
  const data = (error as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data;
  if (Array.isArray(data?.message)) return data.message.join(", ");
  return data?.message ?? (error as Error)?.message ?? fallback;
};
