"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicProfile } from "@/lib/public-profile";
import { initials } from "@/lib/utils";
import { SkillChips } from "@/components/members/SkillChips";

export function PublicMembersView({ members }: { members: PublicProfile[] }) {
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const visible = members.filter((member) => [
    member.full_name, member.headline, member.role, member.company, member.location,
    ...(member.skills ?? []), ...(member.can_help_with ?? []),
  ].filter(Boolean).join(" ").toLowerCase().includes(search));

  return (
    <>
      <label className="mb-8 block max-w-lg">
        <span className="mb-2 block text-sm font-semibold">Zoek leden</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder="Zoek op naam, rol of vak" className="w-full rounded-2xl border border-charcoal/20 bg-white px-4 py-3" />
      </label>
      <p className="mb-4 text-sm text-charcoal/65" role="status">{visible.length} openbare profielen</p>
      {visible.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((member) => (
            <Link key={member.id} href={`/profile/${member.id}`}
              className="rounded-3xl border border-charcoal/10 bg-white/80 p-6 shadow-lg transition hover:border-gold/60">
              <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-deep-blue text-lg font-bold text-white">
                {member.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.photo_url} alt="" className="h-full w-full object-cover" />
                ) : initials(member.full_name)}
              </div>
              <h2 className="text-xl font-bold">{member.full_name}</h2>
              {member.headline ? <p className="mt-2 text-charcoal/70">{member.headline}</p> : null}
              <p className="mt-3 text-sm text-charcoal/65">{[member.role, member.company, member.location].filter(Boolean).join(" · ")}</p>
              {member.skills?.length ? <SkillChips skills={member.skills} limit={3} className="mt-4" /> : null}
              <span className="mt-5 inline-block text-sm font-semibold text-deep-blue">Bekijk profiel →</span>
            </Link>
          ))}
        </div>
      ) : <p className="rounded-3xl border border-charcoal/10 bg-white/80 p-8">{members.length ? "Geen leden gevonden. Probeer een andere zoekopdracht." : "Er zijn nog geen openbare profielen."}</p>}
    </>
  );
}
