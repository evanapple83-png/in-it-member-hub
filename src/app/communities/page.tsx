import Link from "next/link";
import type { ComponentType } from "react";
import { redirect } from "next/navigation";
import { ArrowRight, LockKeyhole, Shield, Trophy, Wrench } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { isApprovedMember } from "@/lib/access";
import { getCommunities } from "@/lib/communities";

const iconBySlug: Record<string, ComponentType<{ className?: string }>> = {
  "security-specialists": Shield,
  engineers: Wrench,
  football: Trophy,
};

export default async function CommunitiesPage() {
  if (!(await isApprovedMember())) redirect("/join?locked=communities");

  const communities = await getCommunities();

  return (
    <PageShell
      eyebrow="Communities"
      title="Focused spaces inside the IN-IT network"
      description="Professional circles and lighter social rooms help members connect beyond a static directory."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {communities.map((community) => {
          const Icon = iconBySlug[community.slug] ?? LockKeyhole;
          return (
            <article
              key={community.id}
              className="group rounded-[2rem] border border-charcoal/10 bg-white/76 p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-deep-blue text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-sand px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-date">
                  {community.category}
                </span>
              </div>
              <h2 className="mt-6 text-2xl font-black text-charcoal">{community.name}</h2>
              <p className="mt-3 min-h-16 leading-7 text-charcoal/62">{community.description}</p>
              <Button className="mt-6" variant="outline" asChild>
                <Link href={`/communities/${community.slug}`}>
                  Open space
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </article>
          );
        })}
      </div>
    </PageShell>
  );
}
