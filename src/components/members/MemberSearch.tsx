"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function MemberSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block">
      <span className="sr-only">Search members</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal/42" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by skill, role, city, company or what someone can help with..."
        className="h-14 rounded-3xl pl-12 text-base"
      />
    </label>
  );
}
