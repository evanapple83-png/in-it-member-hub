import Link from "next/link";
import { KeyRound, ShieldCheck, Sparkles, Users } from "lucide-react";
import { InviteGate } from "@/components/join/InviteGate";
import { PageShell } from "@/components/layout/PageShell";
import { MemberCard } from "@/components/members/MemberCard";
import { approvedSeedMembers } from "@/lib/seed-members";

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ code?: string; locked?: string }> }) {
  const params = await searchParams;

  return (
    <PageShell
      eyebrow="Invite-only"
      title="Join IN-IT with a trusted community invite"
      description="IN-IT grows through known community relationships. A 24-hour admin invite is required before LinkedIn sign-in becomes available."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <div className="rounded-[2rem] border border-charcoal/10 bg-white/72 p-8 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Users, title: "Be discoverable", text: "Help members find your expertise, city and availability." },
              { icon: Sparkles, title: "Offer help", text: "Signal mentoring, collaboration and speaking interests." },
              { icon: ShieldCheck, title: "Stay in control", text: "Consent and admin approval protect member visibility." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-3xl bg-sand/35 p-5">
                <Icon className="h-6 w-6 text-date" />
                <h2 className="mt-4 font-black text-charcoal">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-charcoal/65">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-charcoal/10 pt-8">
            {params.locked ? (
              <div className="mb-5 rounded-3xl border border-date/15 bg-date/7 p-4 text-sm font-semibold text-date">
                This area is private. Enter a valid invite code and sign in to continue.
              </div>
            ) : null}
            <InviteGate initialCode={params.code ?? ""} />
            <p className="mt-4 max-w-2xl text-sm leading-6 text-charcoal/58">
              No invite code yet?{" "}
              <Link href="/request-access" className="font-bold text-deep-blue underline-offset-2 hover:underline">
                Request access
              </Link>{" "}
              and the coordinator will review your request.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-charcoal/58">
              LinkedIn is used only for authentication and basic profile prefill. No scraping, no connection import and no bulk LinkedIn profile import are implemented.
            </p>
          </div>
        </div>
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-deep-blue px-4 py-2 text-sm font-bold text-white">
            <KeyRound className="h-4 w-4" />
            Private preview
          </div>
          <MemberCard member={approvedSeedMembers[1]} />
        </div>
      </div>
    </PageShell>
  );
}
