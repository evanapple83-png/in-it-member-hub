import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Link2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberBadges } from "@/components/members/MemberBadges";
import { MemberCard } from "@/components/members/MemberCard";
import { SkillChips } from "@/components/members/SkillChips";
import { ExternalLink } from "lucide-react";
import { getPublicMember, getPublicMembers } from "@/lib/members";
import { isApprovedMember } from "@/lib/access";
import { hasPublicProfile, similarMembers } from "@/lib/member-utils";
import { initials } from "@/lib/utils";

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isApprovedMember())) redirect("/join?locked=members");

  const { id } = await params;
  const [member, members] = await Promise.all([getPublicMember(id), getPublicMembers()]);
  if (!member) notFound();
  const similar = similarMembers(member, members);

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/members">
            <ArrowLeft className="h-4 w-4" />
            Back to members
          </Link>
        </Button>
        <div className="overflow-hidden rounded-[2rem] border border-charcoal/10 bg-white/78 shadow-[0_28px_90px_rgba(16,54,92,0.12)]">
          <div className="h-3 bg-gradient-to-r from-deep-blue via-gold to-date" />
          <div className="grid gap-8 p-6 md:grid-cols-[280px_1fr] md:p-10">
            <div>
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-deep-blue to-date text-6xl font-black text-white shadow-2xl">
                {member.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(member.full_name)
                )}
              </div>
              <div className="mt-5">
                <MemberBadges member={member} />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tight text-charcoal">{member.full_name}</h1>
              <p className="mt-3 max-w-2xl text-xl leading-8 text-charcoal/70">{member.headline}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-charcoal/62">
                <span>{member.role}</span>
                <span>{member.company}</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {member.location}
                </span>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                {member.linkedin_url ? (
                  <Button asChild>
                    <a href={member.linkedin_url} target="_blank" rel="noreferrer">
                      <Link2 className="h-4 w-4" />
                      Connect on LinkedIn
                    </a>
                  </Button>
                ) : null}
                {hasPublicProfile(member) ? (
                  <Button asChild variant="outline">
                    <Link href={`/p/${member.id}`}>
                      <ExternalLink className="h-4 w-4" />
                      Public profile
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-3xl border border-charcoal/10 bg-white/72 p-6 shadow-sm">
            <h2 className="text-2xl font-black text-charcoal">About</h2>
            <p className="mt-3 leading-8 text-charcoal/68">{member.about}</p>
          </div>
          <div className="rounded-3xl border border-charcoal/10 bg-white/72 p-6 shadow-sm">
            <h2 className="text-2xl font-black text-charcoal">Languages</h2>
            <SkillChips skills={member.languages} className="mt-4" />
          </div>
          <ProfileSection title="Skills" items={member.skills} />
          <ProfileSection title="Can help with" items={member.can_help_with} />
          <ProfileSection title="Looking for" items={member.looking_for} />
        </div>
        <div className="mt-12">
          <h2 className="mb-5 text-3xl font-black text-charcoal">Similar members</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {similar.length ? similar.map((item) => <MemberCard key={item.id} member={item} compact />) : <p>No similar approved members yet.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-charcoal/10 bg-white/72 p-6 shadow-sm">
      <h2 className="text-2xl font-black text-charcoal">{title}</h2>
      <SkillChips skills={items} className="mt-4" />
    </div>
  );
}
