import type { Member } from "@/lib/types";

export function AdminStats({ members }: { members: Member[] }) {
  const month = new Date().getMonth();
  const stats = [
    { label: "Total members", value: members.length },
    { label: "Pending", value: members.filter((member) => member.visibility_status === "pending").length },
    { label: "Approved", value: members.filter((member) => member.visibility_status === "approved").length },
    { label: "New this month", value: members.filter((member) => new Date(member.created_at).getMonth() === month).length },
    { label: "Open to mentor", value: members.filter((member) => member.open_to_mentor).length },
    { label: "Open to opportunities", value: members.filter((member) => member.open_to_opportunities).length },
    { label: "Locations", value: new Set(members.map((member) => member.location).filter(Boolean)).size },
    { label: "Top skills", value: new Set(members.flatMap((member) => member.skills)).size },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-3xl border border-charcoal/10 bg-white/72 p-5 shadow-sm">
          <p className="text-3xl font-black text-deep-blue">{stat.value}</p>
          <p className="mt-2 text-sm font-semibold text-charcoal/62">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
