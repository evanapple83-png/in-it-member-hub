import { AdminClient } from "@/components/admin/AdminClient";
import { PageShell } from "@/components/layout/PageShell";

export default function AdminInvitesPage() {
  return (
    <PageShell
      eyebrow="Admin invites"
      title="Invite-only community growth"
      description="Create and revoke 24-hour invite codes for people already known by the IN-IT community."
    >
      <AdminClient view="invites" />
    </PageShell>
  );
}
