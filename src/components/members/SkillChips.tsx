import { cn } from "@/lib/utils";

export function SkillChips({ skills, limit, className }: { skills: string[]; limit?: number; className?: string }) {
  const visible = typeof limit === "number" ? skills.slice(0, limit) : skills;
  const remaining = typeof limit === "number" ? Math.max(0, skills.length - limit) : 0;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {visible.map((skill) => (
        <span key={skill} className="rounded-full border border-deep-blue/10 bg-dutch-blue/12 px-3 py-1 text-xs font-semibold text-deep-blue">
          {skill}
        </span>
      ))}
      {remaining > 0 ? (
        <span className="rounded-full border border-charcoal/10 bg-white/70 px-3 py-1 text-xs font-semibold text-charcoal/60">
          +{remaining}
        </span>
      ) : null}
    </div>
  );
}
