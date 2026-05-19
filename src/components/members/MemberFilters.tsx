"use client";

import { Grid2X2, List, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  roles: string[];
  skills: string[];
  locations: string[];
  companies: string[];
  filters: Record<string, string | boolean | undefined>;
  onFilter: (key: string, value: string | boolean | undefined) => void;
  view: "grid" | "list";
  onView: (view: "grid" | "list") => void;
};

export function MemberFilters({ roles, skills, locations, companies, filters, onFilter, view, onView }: Props) {
  return (
    <div className="rounded-3xl border border-charcoal/10 bg-white/68 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-charcoal">
          <SlidersHorizontal className="h-4 w-4 text-date" />
          Filters
        </span>
        <SelectFilter label="Role" value={filters.role as string} items={roles} onChange={(value) => onFilter("role", value)} />
        <SelectFilter label="Skill" value={filters.skill as string} items={skills} onChange={(value) => onFilter("skill", value)} />
        <SelectFilter label="Location" value={filters.location as string} items={locations} onChange={(value) => onFilter("location", value)} />
        <SelectFilter label="Company" value={filters.company as string} items={companies} onChange={(value) => onFilter("company", value)} />
        <SelectFilter
          label="Sort"
          value={(filters.sort as string) ?? "newest"}
          items={["newest", "name", "most-skills"]}
          onChange={(value) => onFilter("sort", value)}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            ["open_to_mentor", "Mentor"],
            ["open_to_opportunities", "Open to work"],
            ["open_to_collaborate", "Collaborate"],
            ["open_to_speaking", "Speaker"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onFilter(key, filters[key] ? undefined : true)}
              className={cn(
                "rounded-full border px-3 py-2 text-xs font-bold transition",
                filters[key]
                  ? "border-date bg-date text-white"
                  : "border-charcoal/10 bg-white/70 text-charcoal/65 hover:border-date/30 hover:text-date",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex rounded-full border border-charcoal/10 bg-white/70 p-1">
          <Button variant={view === "grid" ? "primary" : "ghost"} size="icon" onClick={() => onView("grid")} aria-label="Grid view">
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button variant={view === "list" ? "primary" : "ghost"} size="icon" onClick={() => onView("list")} aria-label="List view">
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value?: string;
  items: string[];
  onChange: (value: string | undefined) => void;
}) {
  return (
    <label className="min-w-36 text-xs font-bold text-charcoal/58">
      <span className="sr-only">{label}</span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || undefined)}
        className="h-10 w-full rounded-full border border-charcoal/10 bg-white/78 px-3 text-sm font-semibold text-charcoal outline-none transition focus:border-deep-blue/40"
      >
        <option value="">{label}</option>
        {items.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
