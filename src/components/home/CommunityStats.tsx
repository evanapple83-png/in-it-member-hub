import Image from "next/image";
import type { Member } from "@/lib/types";

export function CommunityStats({ members }: { members: Member[] }) {
  const stats = [
    { label: "Approved members", value: members.length },
    { label: "Cities represented", value: new Set(members.map((member) => member.location)).size },
    { label: "Skill signals", value: new Set(members.flatMap((member) => member.skills)).size },
    { label: "Mentors available", value: members.filter((member) => member.open_to_mentor).length },
  ];

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-[1.1fr_repeat(4,1fr)]">
        <div className="relative hidden overflow-hidden rounded-3xl border border-charcoal/10 bg-white/58 p-6 shadow-sm backdrop-blur md:block">
          <Image
            src="/in-it-winged-icon.png"
            alt=""
            width={150}
            height={150}
            className="absolute -bottom-8 -right-6 opacity-45 mix-blend-multiply"
          />
          <p className="relative text-sm font-bold uppercase tracking-[0.18em] text-date">Culture meets technology</p>
          <p className="relative mt-3 max-w-52 text-sm leading-6 text-charcoal/62">
            A subtle Iraqi heritage mark woven into a Dutch digital community.
          </p>
        </div>
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-charcoal/10 bg-white/72 p-6 shadow-sm">
            <p className="text-4xl font-black text-deep-blue">{stat.value}</p>
            <p className="mt-2 text-sm font-semibold text-charcoal/62">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
