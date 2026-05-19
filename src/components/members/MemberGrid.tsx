"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EmptyState } from "@/components/ui/EmptyState";
import { MemberCard } from "@/components/members/MemberCard";
import type { Member } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MemberGrid({ members, view = "grid" }: { members: Member[]; view?: "grid" | "list" }) {
  if (!members.length) {
    return (
      <EmptyState
        title="No matching members yet"
        description="Try another skill, location or availability filter. The hub only shows approved members who gave consent."
      />
    );
  }

  return (
    <motion.div
      layout
      className={cn(view === "grid" ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3" : "grid gap-4")}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045 } } }}
    >
      <AnimatePresence mode="popLayout">
        {members.map((member) => (
          <motion.div key={member.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
            <MemberCard member={member} compact={view === "list"} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
