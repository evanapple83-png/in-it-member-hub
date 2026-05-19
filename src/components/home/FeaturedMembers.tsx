import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MemberCard } from "@/components/members/MemberCard";
import { Button } from "@/components/ui/button";
import type { Member } from "@/lib/types";

export function FeaturedMembers({ members }: { members: Member[] }) {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-date">Featured members</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-charcoal">Expertise with a human face</h2>
            <p className="mt-3 max-w-2xl text-charcoal/65">
              Every visible profile has consent and approval, so the directory feels trusted from day one.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/members">
              View directory
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {members.slice(0, 3).map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
}
