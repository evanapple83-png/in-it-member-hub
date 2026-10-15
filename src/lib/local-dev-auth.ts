const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Opt-in local login must never become an authentication bypass in a deployment. */
export function isLocalDevAuthEnabled() {
  if (process.env.NODE_ENV !== "development" || process.env.VERCEL || process.env.LOCAL_DEV_AUTH !== "true") return false;
  try {
    return LOOPBACK_HOSTS.has(new URL(process.env.DATABASE_URL ?? "").hostname)
      && LOOPBACK_HOSTS.has(new URL(process.env.NEXTAUTH_URL ?? "").hostname);
  } catch {
    return false;
  }
}

export const LOCAL_DEV_USERS = {
  admin: { id: "local-dev-admin", name: "Local Admin", email: "admin@example.test" },
  member: { id: "local-dev-member", name: "Amina Hassan", email: "amina.hassan@example.test" },
  pending: { id: "local-dev-pending", name: "Pending Demo", email: "pending-dev@example.test" },
} as const;
