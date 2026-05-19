"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { MemberGrid } from "@/components/members/MemberGrid";
import { Input } from "@/components/ui/input";
import { filterMembers } from "@/lib/member-utils";
import type { Member } from "@/lib/types";

const suggestions = [
  "I need help with Azure",
  "Who can mentor a junior developer?",
  "Who knows cybersecurity?",
  "Who works with data engineering?",
  "Who is open to speaking at events?",
];

export function FindMemberSection({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("Azure");
  const results = useMemo(() => filterMembers(members, { query, sort: "most-skills" }).slice(0, 3), [members, query]);

  return (
    <section className="bg-charcoal px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold">Smart matching V0</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">Find the right member</h2>
          <p className="mt-4 text-white/66">
            Keyword matching across skills, roles, help offers, languages and availability. Structured so semantic search can be added later.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuery(item)}
                className="rounded-full border border-white/14 bg-white/8 px-3 py-2 text-xs font-bold text-white/80 transition hover:bg-white/14"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal/42" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-14 rounded-3xl pl-12" />
          </label>
          <div className="mt-5">
            <MemberGrid members={results} />
          </div>
        </div>
      </div>
    </section>
  );
}
