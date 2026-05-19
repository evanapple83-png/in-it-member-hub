import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl border border-dashed border-charcoal/15 bg-white/70 p-10 text-center shadow-sm", className)}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sand/70 text-date">
        <SearchX className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-charcoal">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-charcoal/65">{description}</p>
    </div>
  );
}
