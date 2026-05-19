"use client";

import { useMemo, useState } from "react";
import { MemberFilters } from "@/components/members/MemberFilters";
import { MemberGrid } from "@/components/members/MemberGrid";
import { MemberSearch } from "@/components/members/MemberSearch";
import { filterMembers, uniqueSkills, uniqueValues } from "@/lib/member-utils";
import type { Member, MemberSort } from "@/lib/types";

export function MembersDirectory({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string | boolean | undefined>>({ sort: "newest" });
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(
    () =>
      filterMembers(members, {
        query,
        role: filters.role as string,
        skill: filters.skill as string,
        location: filters.location as string,
        company: filters.company as string,
        open_to_mentor: Boolean(filters.open_to_mentor),
        open_to_opportunities: Boolean(filters.open_to_opportunities),
        open_to_collaborate: Boolean(filters.open_to_collaborate),
        open_to_speaking: Boolean(filters.open_to_speaking),
        sort: filters.sort as MemberSort,
      }),
    [members, query, filters],
  );

  return (
    <div className="grid gap-5">
      <MemberSearch value={query} onChange={setQuery} />
      <MemberFilters
        roles={uniqueValues(members, "role")}
        skills={uniqueSkills(members)}
        locations={uniqueValues(members, "location")}
        companies={uniqueValues(members, "company")}
        filters={filters}
        onFilter={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
        view={view}
        onView={setView}
      />
      <p className="text-sm font-medium text-charcoal/58">{filtered.length} approved members visible</p>
      <MemberGrid members={filtered} view={view} />
    </div>
  );
}
