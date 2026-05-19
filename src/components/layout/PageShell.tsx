import { CulturalPattern } from "@/components/ui/CulturalPattern";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
  eyebrow,
  title,
  description,
}: {
  children: React.ReactNode;
  className?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8", className)}>
      <CulturalPattern />
      <div className="relative mx-auto max-w-7xl">
        {title ? (
          <div className="mb-8 max-w-3xl">
            {eyebrow ? <p className="text-sm font-bold uppercase tracking-[0.18em] text-date">{eyebrow}</p> : null}
            <h1 className="mt-3 text-4xl font-black tracking-tight text-charcoal sm:text-5xl">{title}</h1>
            {description ? <p className="mt-4 text-lg leading-8 text-charcoal/68">{description}</p> : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
