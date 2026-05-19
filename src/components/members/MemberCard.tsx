"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Link2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberBadges } from "@/components/members/MemberBadges";
import { SkillChips } from "@/components/members/SkillChips";
import type { Member } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

export function MemberCard({ member, compact = false }: { member: Member; compact?: boolean }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-charcoal/10 bg-white/78 p-5 shadow-[0_24px_80px_rgba(16,54,92,0.10)] backdrop-blur transition hover:border-gold/55 hover:shadow-[0_28px_90px_rgba(111,38,55,0.14)]",
        compact && "p-4",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-deep-blue via-gold to-date opacity-70" />
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-deep-blue to-date text-lg font-black text-white shadow-lg">
          {member.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.photo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(member.full_name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black text-charcoal">{member.full_name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-charcoal/68">{member.headline}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-charcoal/58">
            <span>{member.role}</span>
            <span>{member.company}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {member.location}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-5">
        <SkillChips skills={member.skills} limit={3} />
      </div>
      {!compact ? (
        <>
          <p className="mt-5 text-sm font-semibold text-charcoal">Can help with</p>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-charcoal/62">{member.can_help_with.join(", ")}</p>
        </>
      ) : null}
      <div className="mt-5">
        <MemberBadges member={member} />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href={`/members/${member.id}`}>View profile</Link>
        </Button>
        {member.linkedin_url ? (
          <Button asChild variant="outline" size="sm">
            <a href={member.linkedin_url} target="_blank" rel="noreferrer">
              <Link2 className="h-4 w-4" />
              LinkedIn
            </a>
          </Button>
        ) : null}
      </div>
    </motion.article>
  );
}
