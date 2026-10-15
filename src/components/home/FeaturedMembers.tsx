import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillChips } from "@/components/members/SkillChips";
import { initials } from "@/lib/utils";
import type { PublicProfile } from "@/lib/public-profile";

export function FeaturedMembers({ members, developmentPreview }: { members: PublicProfile[]; developmentPreview: boolean }) {
  return (
    <section id="community" aria-labelledby="community-title" className="scroll-mt-28 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-date">Meet the community</p>
            <h2 id="community-title" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Your next connection starts here.</h2>
            <p className="mt-4 max-w-xl leading-7 text-charcoal/65">Different specialities, experiences and career paths. Get to know the people who choose to share their profiles.</p>
          </div>
          <Link href="/members" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-deep-blue hover:underline">Explore all members <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {developmentPreview && members.length > 0 ? <p className="mb-5 rounded-2xl bg-sand/40 px-4 py-3 text-sm text-charcoal/70">Development preview: profiles may include fictional demo members.</p> : null}
        {members.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {members.slice(0, 6).map((member) => (
              <article key={member.id} className="flex flex-col rounded-3xl border border-charcoal/10 bg-white/80 p-6 shadow-[0_12px_40px_-25px_rgba(16,54,92,0.25)]">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-deep-blue/10 text-lg font-bold text-deep-blue">
                    {member.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : initials(member.full_name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold tracking-tight"><Link href={`/profile/${member.id}`} className="hover:text-date">{member.full_name}</Link></h3>
                    {member.role || member.headline ? <p className="mt-1 text-sm leading-6 text-charcoal/65">{member.role || member.headline}</p> : null}
                  </div>
                </div>
                {member.location ? <p className="mt-5 flex items-center gap-2 text-sm text-charcoal/60"><MapPin className="h-4 w-4" />{member.location}</p> : null}
                {member.skills?.length ? <SkillChips skills={member.skills} limit={3} className="mt-4" /> : null}
                <div className="mt-auto pt-6"><Link href={`/profile/${member.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-deep-blue hover:underline">View profile <ArrowRight className="h-4 w-4" /><span className="sr-only"> of {member.full_name}</span></Link></div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-charcoal/10 bg-white/70 p-8 sm:p-12">
            <h3 className="text-xl font-bold">Make your first connection.</h3>
            <p className="mb-6 mt-3 max-w-xl leading-7 text-charcoal/65">Public profiles will appear here as members choose to share them. You can already explore what IN-IT is about and request to join.</p>
            <Button asChild variant="outline"><Link href="/request-access">Request to join <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
        )}
      </div>
    </section>
  );
}
