import Link from "next/link";
import { notFound } from "next/navigation";
import { Link2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillChips } from "@/components/members/SkillChips";
import { getPublicProfile } from "@/lib/members";
import { isFieldPublic } from "@/lib/member-utils";
import { initials } from "@/lib/utils";

// Public, non-authenticated profile page (FR-002/012/013). Renders ONLY the fields the
// member explicitly marked public. Everything else stays in the closed member directory.
export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getPublicProfile(id);
  if (!member) notFound();

  const show = (key: Parameters<typeof isFieldPublic>[1]) => isFieldPublic(member, key);

  return (
    <section className="relative px-4 pb-16 pt-32 sm:px-6 sm:pt-36 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-date">Publiek profiel · IN-IT Community</p>
        <div className="mt-4 overflow-hidden rounded-[2rem] border border-charcoal/10 bg-white/82 shadow-[0_28px_90px_rgba(16,54,92,0.12)]">
          <div className="h-3 bg-gradient-to-r from-deep-blue via-gold to-date" />
          <div className="grid gap-6 p-6 sm:grid-cols-[160px_1fr] sm:p-9">
            <div className="flex aspect-square h-40 w-40 items-center justify-center overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-deep-blue to-date text-4xl font-black text-white shadow-xl">
              {show("photo_url") && member.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.photo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(member.full_name)
              )}
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-charcoal">{member.full_name}</h1>
              {show("headline") && member.headline ? (
                <p className="mt-3 text-lg leading-7 text-charcoal/70">{member.headline}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-charcoal/62">
                {show("role") && member.role ? <span>{member.role}</span> : null}
                {show("company") && member.company ? <span>{member.company}</span> : null}
                {show("location") && member.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {member.location}
                  </span>
                ) : null}
              </div>
              {show("linkedin_url") && member.linkedin_url ? (
                <div className="mt-5">
                  <Button asChild size="sm">
                    <a href={member.linkedin_url} target="_blank" rel="noreferrer">
                      <Link2 className="h-4 w-4" />
                      LinkedIn
                    </a>
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          {show("about") && member.about ? (
            <div className="border-t border-charcoal/8 p-6 sm:px-9">
              <h2 className="text-lg font-black text-charcoal">Over mij</h2>
              <p className="mt-2 leading-7 text-charcoal/68">{member.about}</p>
            </div>
          ) : null}

          {show("skills") && member.skills.length ? (
            <div className="border-t border-charcoal/8 p-6 sm:px-9">
              <h2 className="text-lg font-black text-charcoal">Skills</h2>
              <SkillChips skills={member.skills} className="mt-3" />
            </div>
          ) : null}

          {show("can_help_with") && member.can_help_with.length ? (
            <div className="border-t border-charcoal/8 p-6 sm:px-9">
              <h2 className="text-lg font-black text-charcoal">Kan helpen met</h2>
              <SkillChips skills={member.can_help_with} className="mt-3" />
            </div>
          ) : null}

          {show("languages") && member.languages.length ? (
            <div className="border-t border-charcoal/8 p-6 sm:px-9">
              <h2 className="text-lg font-black text-charcoal">Talen</h2>
              <SkillChips skills={member.languages} className="mt-3" />
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-sm leading-6 text-charcoal/55">
          Dit is een publieke profielpagina. Leden van IN-IT zien het volledige profiel na inloggen.{" "}
          <Link href="/join" className="font-bold text-deep-blue underline-offset-2 hover:underline">
            Inloggen
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
