import { cache } from "react";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, hasDatabase } from "@/db";
import { admins, members, type MemberRow } from "@/db/schema";
import { authOptions, isBootstrapAdminEmail } from "@/lib/auth";

/**
 * Where a visitor stands on the way into the member hub.
 *
 * - anon         no session
 * - no-member    signed in, but no `members` row yet (fresh invite, onboarding not started)
 * - incomplete   row exists, but onboarding or consent is missing
 * - pending      waiting for coordinator approval
 * - approved     full access (`approved` or `active`, with consent)
 * - rejected     application declined
 * - deactivated  switched off by a coordinator (`deactivated`), or hidden (`hidden`)
 *
 * `hidden` keeps today's behavior: `getApprovedCurrentMember` only lets `approved` in, so a
 * hidden member has no access and lands on the waiting screen. `rawStatus` exposes the
 * stored value so /wachten can tell the two apart.
 */
export type AccessState = "anon" | "no-member" | "incomplete" | "pending" | "approved" | "rejected" | "deactivated";

export type AccessResult = {
  state: AccessState;
  userId: string | null;
  member: MemberRow | null;
  rawStatus: string | null;
};

const ACCESS_STATUSES = new Set(["approved", "active"]);

// Cached per request, so layouts, shells and pages can all ask without extra queries.
export const getAccessState = cache(async (): Promise<AccessResult> => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || null;
  if (!userId) return { state: "anon", userId: null, member: null, rawStatus: null };
  if (!hasDatabase()) return { state: "no-member", userId, member: null, rawStatus: null };

  const db = getDb();
  const [member] = await db.select().from(members).where(eq(members.userId, userId)).limit(1);
  if (!member) return { state: "no-member", userId, member: null, rawStatus: null };

  const status = member.visibilityStatus;
  const base = { userId, member, rawStatus: status };

  // Approved + consent is access, as today (approved members are never bounced back to onboarding).
  if (ACCESS_STATUSES.has(status) && member.consentGiven) return { ...base, state: "approved" };
  if (!member.onboardingCompleted || !member.consentGiven) return { ...base, state: "incomplete" };
  if (status === "rejected") return { ...base, state: "rejected" };
  if (status === "deactivated" || status === "hidden") return { ...base, state: "deactivated" };
  return { ...base, state: "pending" };
});

// Admin role for the signed-in user (or null). Cached per request.
export const getAdminRoleForUser = cache(async (userId: string | null): Promise<string | null> => {
  if (!userId || !hasDatabase()) return null;
  const db = getDb();
  const [admin] = await db.select({ role: admins.role }).from(admins).where(eq(admins.userId, userId)).limit(1);
  return admin?.role ?? null;
});

// Where each state belongs when it is not allowed on the current screen.
export function homeForState(state: AccessState): string {
  switch (state) {
    case "anon":
      return "/inloggen";
    case "no-member":
    case "incomplete":
      return "/onboarding";
    case "approved":
      return "/vandaag";
    default:
      return "/wachten";
  }
}

// Gate for the member hub: only approved members get through, everyone else is sent on.
// Pass the requested path as `from` and the waiting screen says "Je probeerde <path> te openen".
export async function requireApprovedAccess(from?: string) {
  const access = await getAccessState();
  if (access.state !== "approved") {
    const home = homeForState(access.state);
    const requested = from ?? (await headers()).get("x-in-it-path") ?? undefined;
    const van = requested && requested.startsWith("/") && !requested.startsWith("//") ? requested : null;
    redirect(home === "/wachten" && van ? `/wachten?van=${encodeURIComponent(van)}` : home);
  }
  return access as AccessResult & { member: MemberRow };
}

// Gate for /admin: approved member with an admin row. Non-admin members go to /vandaag.
// Exception (Evan, 30 sep): a founder in BOOTSTRAP_ADMIN_EMAILS who holds an admin row always
// gets in, even without an approved profile, so a founder can never be locked out (June incident).
export async function requireAdminAccess() {
  const access = await getAccessState();
  if (access.state !== "approved") {
    const session = await getServerSession(authOptions);
    const role = await getAdminRoleForUser(access.userId);
    if (role && isBootstrapAdminEmail(session?.user?.email)) {
      return { ...access, adminRole: role, founderName: session?.user?.name ?? "Beheerder" };
    }
    return { ...(await requireApprovedAccess()), adminRole: "" as string, founderName: null as string | null };
  }
  const role = await getAdminRoleForUser(access.userId);
  if (!role) redirect("/vandaag");
  return { ...(access as AccessResult & { member: MemberRow }), adminRole: role, founderName: null as string | null };
}
