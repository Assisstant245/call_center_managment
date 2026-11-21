export const ALL_ROLES = [
  "admin",
  "manager",
  "planner",
  "supervisor",
  "agent",
] as const;

export type Role = (typeof ALL_ROLES)[number];

/** Can create/edit master data, forecasts and schedules. */
export const MANAGEMENT_ROLES: Role[] = ["admin", "manager", "planner"];

/** Can approve time-off / swaps and monitor adherence. */
export const REVIEWER_ROLES: Role[] = [...MANAGEMENT_ROLES, "supervisor"];
