import { Briefcase, Handshake, Mic2, Sparkles } from "lucide-react";
import type { Member } from "@/lib/types";

export function MemberBadges({ member }: { member: Member }) {
  const badges = [
    member.open_to_mentor && { label: "Mentor", icon: Sparkles },
    member.open_to_opportunities && { label: "Open to work", icon: Briefcase },
    member.open_to_collaborate && { label: "Collaborate", icon: Handshake },
    member.open_to_speaking && { label: "Speaker", icon: Mic2 },
  ].filter(Boolean) as { label: string; icon: typeof Sparkles }[];

  if (!badges.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map(({ label, icon: Icon }) => (
        <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-date/8 px-3 py-1 text-xs font-semibold text-date">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
      ))}
    </div>
  );
}
