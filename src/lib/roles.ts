// Capability model for the coordinator/beheerder split (FRD §5).
//
// The FRD defines coordinator (toegang + activiteiten) and beheerder (moderatie + gebruikers)
// as separate roles, but notes they are currently the SAME person. So today every admin row
// holds every capability. When the roles are formally split, gate here by `role`
// (e.g. coordinator -> review_access/manage_activities, beheerder -> moderate/manage_users)
// without touching the call sites.

export type AdminRole = "coordinator" | "admin";

export type AdminCapability =
  | "review_access" // FR-005: beoordelen toegangsaanvragen
  | "manage_activities" // FR-024: activiteiten beheren (coordinator-only in spec)
  | "moderate" // FR-015: content/profiel moderatie
  | "manage_users" // FR-016/019: gebruikersbeheer
  | "manage_communities"; // Niet in FRD: communities aanmaken/beheren (extra-wens Evan)

// Returns the capabilities a role holds, or `null` for "all capabilities".
// Today both known roles map to null (combined coordinator+beheerder). To split the roles,
// return concrete capability lists per role here; call sites already gate on adminCan().
// The admins.role column defaults to "admin", so every existing row keeps full access.
// Anything else (a typo, an empty value, a future role not wired up yet) gets nothing: fail closed.
function capabilitiesFor(role: string | null | undefined): AdminCapability[] | null {
  switch (role) {
    case "coordinator":
    case "admin":
      return null;
    default:
      return [];
  }
}

export function adminCan(role: string | null | undefined, capability: AdminCapability): boolean {
  const capabilities = capabilitiesFor(role);
  return capabilities === null || capabilities.includes(capability);
}
