"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/app/Avatar";
import { COVER_CROPS, Cover } from "@/components/app/Cover";
import { EmptyState } from "@/components/app/EmptyState";
import { Pills } from "@/components/app/Pills";
import { Icon } from "@/components/ui/icon";

export type DirectoryMember = {
  id: string;
  name: string;
  photoUrl: string | null;
  role: string | null;
  place: string | null;
  mentor: boolean;
  opportunities: boolean;
  speaker: boolean;
  search: string;
};

type Filter = "alle" | "mentor" | "kansen" | "spreker";

const TAGS: { key: Exclude<Filter, "alle">; label: string; test: (m: DirectoryMember) => boolean }[] = [
  { key: "mentor", label: "Mentor", test: (m) => m.mentor },
  { key: "kansen", label: "Open voor kansen", test: (m) => m.opportunities },
  { key: "spreker", label: "Spreker", test: (m) => m.speaker },
];

// Ledenoverzicht: filter pills with real counts, search on name/role/skills, grid or list.
export function MembersView({ members }: { members: DirectoryMember[] }) {
  const [filter, setFilter] = useState<Filter>("alle");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const q = query.trim().toLowerCase();
  const list = useMemo(() => {
    const tag = TAGS.find((t) => t.key === filter);
    return members.filter((m) => (!tag || tag.test(m)) && (!q || m.search.includes(q)));
  }, [members, filter, q]);

  const pills = [
    { key: "alle", label: "Alle leden", count: members.length },
    ...TAGS.map((t) => ({ key: t.key, label: t.label, count: members.filter(t.test).length })),
  ];

  const tagsOf = (m: DirectoryMember) => TAGS.filter((t) => t.test(m)).map((t) => t.label);
  const sub = (m: DirectoryMember) => [m.role, m.place].filter(Boolean).join(" · ");

  return (
    <>
      <div className="toolbar">
        <Pills items={pills} active={filter} onChange={(key) => setFilter(key as Filter)} label="Filter leden" className="seg-pills" />
        <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, justifyContent: "flex-end", minWidth: 0 }}>
          <label className="field">
            <Icon name="search" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Zoek op naam, rol of vak"
              aria-label="Zoek leden"
              type="search"
            />
          </label>
          <div className="viewtog desk-only" role="group" aria-label="Weergave">
            <button type="button" className={view === "grid" ? "on" : undefined} onClick={() => setView("grid")} aria-pressed={view === "grid"} aria-label="Rasterweergave">
              <Icon name="grid" />
            </button>
            <button type="button" className={view === "list" ? "on" : undefined} onClick={() => setView("list")} aria-pressed={view === "list"} aria-label="Lijstweergave">
              <Icon name="list" />
            </button>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon="search"
            title="Niemand gevonden"
            text={filter === "alle" ? "Probeer een andere naam of rol." : "Probeer een andere rol of zet het filter terug op alle leden."}
          />
        </div>
      ) : view === "list" ? (
        <div className="mlist">
          {list.map((m) => (
            <Link key={m.id} href={`/members/${m.id}`} className="mrow">
              <Avatar name={m.name} photoUrl={m.photoUrl} id={m.id} />
              <span className="t">
                <b>{m.name}</b>
                {sub(m) ? <small>{sub(m)}</small> : null}
              </span>
              <span className="desk-only chips">
                {tagsOf(m).map((t) => (
                  <span key={t} className="chip tag">
                    {t}
                  </span>
                ))}
              </span>
              <Icon name="arrow" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="tiles three">
          {list.map((m, i) => (
            <Link key={m.id} href={`/members/${m.id}`} className="tile mcard">
              <Cover crop={COVER_CROPS[(i + 6) % COVER_CROPS.length]} />
              <Avatar name={m.name} photoUrl={m.photoUrl} id={m.id} />
              <div className="body" style={{ justifyItems: "center" }}>
                <h4>{m.name}</h4>
                {m.role ? (
                  <p className="muted" style={{ fontSize: 14 }}>
                    {m.role}
                  </p>
                ) : null}
              </div>
              {tagsOf(m).length ? (
                <div className="tags">
                  {tagsOf(m).map((t) => (
                    <span key={t} className="chip tag">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
