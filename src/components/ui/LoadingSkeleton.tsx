import { cn } from "@/lib/utils";

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-charcoal/10", className)} />;
}

export function MemberCardSkeleton() {
  return (
    <div className="rounded-3xl border border-charcoal/10 bg-white/75 p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <LoadingSkeleton className="h-14 w-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton className="h-4 w-36" />
          <LoadingSkeleton className="h-3 w-48" />
        </div>
      </div>
      <LoadingSkeleton className="mt-5 h-20 w-full" />
      <div className="mt-5 flex gap-2">
        <LoadingSkeleton className="h-8 w-20" />
        <LoadingSkeleton className="h-8 w-24" />
        <LoadingSkeleton className="h-8 w-16" />
      </div>
    </div>
  );
}
