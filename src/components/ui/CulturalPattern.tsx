import { cn } from "@/lib/utils";

export function CulturalPattern({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 opacity-[0.08]",
        "bg-[linear-gradient(135deg,rgba(111,38,55,0.9)_1px,transparent_1px),linear-gradient(45deg,rgba(16,54,92,0.85)_1px,transparent_1px)] bg-[size:34px_34px]",
        className,
      )}
    />
  );
}
