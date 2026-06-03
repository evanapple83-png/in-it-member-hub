"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ShieldAlert } from "lucide-react";
import { AccessRequestsClient } from "@/components/admin/AccessRequestsClient";
import { AdminStats } from "@/components/admin/AdminStats";
import { CsvImport } from "@/components/admin/CsvImport";
import { InviteManagement } from "@/components/admin/InviteManagement";
import { MemberManagementTable } from "@/components/admin/MemberManagementTable";
import { PendingMembersTable } from "@/components/admin/PendingMembersTable";
import { LinkedInButton } from "@/components/join/LinkedInButton";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { Member } from "@/lib/types";

export function AdminClient({ view }: { view: "dashboard" | "members" | "pending" | "import" | "invites" | "requests" }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unauthorized">("loading");
  const [error, setError] = useState<string | null>(null);
  const { status: sessionStatus } = useSession();

  useEffect(() => {
    if (sessionStatus === "loading") return;
    async function load() {
      try {
        if (sessionStatus !== "authenticated") {
          setStatus("unauthorized");
          setError("Sign in with LinkedIn as an approved admin to access this area.");
          return;
        }
        const response = await fetch("/api/admin/members");
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          setStatus("unauthorized");
          setError(body.error ?? "Unauthorized admin route.");
          return;
        }
        setMembers(body.members ?? []);
        setStatus("ready");
      } catch {
        setStatus("unauthorized");
        setError("This area is protected. Sign in with an admin account to continue.");
      }
    }
    load();
  }, [sessionStatus]);

  const pending = useMemo(() => members.filter((member) => member.visibility_status === "pending"), [members]);

  if (status === "loading") {
    return (
      <div className="grid gap-4">
        <LoadingSkeleton className="h-28" />
        <LoadingSkeleton className="h-72" />
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="rounded-[2rem] border border-date/15 bg-white/78 p-8 shadow-sm">
        <ShieldAlert className="h-10 w-10 text-date" />
        <h2 className="mt-4 text-2xl font-black text-charcoal">Admin area protected</h2>
        <p className="mt-3 max-w-2xl leading-7 text-charcoal/66">{error}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkedInButton label="Sign in with LinkedIn" />
          <Button asChild variant="outline">
            <Link href="/members">Back to members</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (view === "import") return <CsvImport />;
  if (view === "invites") return <InviteManagement />;
  if (view === "requests") return <AccessRequestsClient />;
  if (view === "members") return <MemberManagementTable members={members} />;
  if (view === "pending") return <PendingMembersTable members={pending} />;

  return (
    <div className="grid gap-6">
      <AdminStats members={members} />
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/admin/requests">Access requests</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/members/pending">Pending approvals</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/members">All members</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/invites">Invite codes</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/events">Activities</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/communities">Communities</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/import">CSV import</Link>
        </Button>
      </div>
    </div>
  );
}
