"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Avatar } from "@/components/app/Avatar";
import { Cover, cropFor } from "@/components/app/Cover";
import { DateTile } from "@/components/app/DateTile";
import { Icon } from "@/components/ui/icon";
import type { SearchIndex } from "@/lib/shell-data";

type Hit = { key: string; href: string; lead: ReactNode; title: string; sub: string };

const DAY = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "short", timeZone: "Europe/Amsterdam" });

// Build the result sections for a query (same limits as the prototype).
function search(index: SearchIndex, raw: string): [string, Hit[]][] {
  const q = raw.trim().toLowerCase();
  const m = (s: string) => !q || s.toLowerCase().includes(q);
  const sections: [string, Hit[]][] = [
    [
      "Leden",
      index.members
        .filter((x) => m(`${x.name} ${x.role ?? ""}`))
        .slice(0, 4)
        .map((x) => ({
          key: `m-${x.id}`,
          href: `/members/${x.id}`,
          lead: <Avatar name={x.name} photoUrl={x.photoUrl} id={x.id} size="sm" />,
          title: x.name,
          sub: x.role ?? "Lid",
        })),
    ],
    [
      "Groepen",
      index.groups
        .filter((g) => m(`${g.name} ${g.category}`))
        .map((g) => ({
          key: `g-${g.slug}`,
          href: `/communities/${g.slug}`,
          lead: <Cover crop={cropFor(g.slug)} className="cv" />,
          title: g.name,
          sub: g.category === "social" ? "Sociaal" : "Vakgroep",
        })),
    ],
    [
      "Activiteiten",
      index.events
        .filter((e) => m(`${e.title} ${e.location ?? ""}`))
        .slice(0, 4)
        .map((e) => ({
          key: `e-${e.slug}`,
          href: `/agenda/${e.slug}`,
          lead: <DateTile date={e.startsAt} small />,
          title: e.title,
          sub: [DAY.format(new Date(e.startsAt)), e.location].filter(Boolean).join(" · "),
        })),
    ],
    [
      "Verhalen",
      index.stories
        .filter((s) => m(s.title))
        .slice(0, 3)
        .map((s) => ({
          key: `s-${s.slug}`,
          href: `/blog/${s.slug}`,
          lead: <Cover crop={cropFor(s.slug)} className="cv" />,
          title: s.title,
          sub: s.author,
        })),
    ],
  ];
  return sections.filter(([, hits]) => hits.length > 0);
}

// ⌘K body: query field, grouped results with a gliding highlight, arrows + Enter + Esc.
// Rendered inside a <Layer kind="cmdk">; `onDone` closes it.
export function CommandPalette({ index, onDone }: { index: SearchIndex; onDone: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [act, setAct] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const hlRef = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);

  const sections = useMemo(() => search(index, query), [index, query]);
  const hits = useMemo(() => sections.flatMap(([, list]) => list), [sections]);
  const numbered = useMemo(() => {
    let n = 0;
    return sections.map(([heading, list]) => [heading, list.map((hit) => ({ hit, index: n++ }))] as const);
  }, [sections]);
  const current = Math.min(act, Math.max(0, hits.length - 1));

  // Glide the highlight to the active row (instant the first time).
  useLayoutEffect(() => {
    const hl = hlRef.current;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-i="${current}"]`);
    if (!hl) return;
    if (!el) {
      hl.style.height = "0";
      return;
    }
    if (!placed.current) hl.style.transition = "none";
    hl.style.transform = `translateY(${el.offsetTop}px)`;
    hl.style.height = `${el.offsetHeight}px`;
    if (!placed.current) {
      void hl.offsetHeight;
      hl.style.transition = "";
      placed.current = true;
    }
    el.scrollIntoView({ block: "nearest" });
  }, [current, hits]);

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setAct(Math.min(current + 1, hits.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setAct(Math.max(current - 1, 0));
    } else if (event.key === "Enter" && hits[current]) {
      event.preventDefault();
      router.push(hits[current].href);
      onDone();
    }
  }

  return (
    <>
      <div className="q">
        <Icon name="search" />
        <input
          data-autofocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setAct(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Zoek leden, groepen, activiteiten, verhalen"
          aria-label="Zoeken"
          autoComplete="off"
          role="combobox"
          aria-expanded="true"
          aria-controls="cmdk-results"
          aria-activedescendant={hits[current] ? `cmdk-${hits[current].key}` : undefined}
        />
        <button className="icon-btn" style={{ width: 32, height: 32 }} type="button" onClick={onDone} aria-label="Sluiten">
          <Icon name="x" />
        </button>
      </div>
      <div className="res" id="cmdk-results" role="listbox" aria-label="Resultaten" ref={listRef}>
        <span className="hl" ref={hlRef} />
        {numbered.length ? (
          numbered.map(([heading, list]) => (
            <div key={heading} role="presentation">
              <h6>{heading}</h6>
              {list.map(({ hit, index }) => {
                return (
                  <Link
                    key={hit.key}
                    id={`cmdk-${hit.key}`}
                    href={hit.href}
                    className={index === current ? "it act" : "it"}
                    data-i={index}
                    role="option"
                    aria-selected={index === current}
                    tabIndex={-1}
                    onMouseMove={() => index !== current && setAct(index)}
                    onClick={onDone}
                  >
                    {hit.lead}
                    <span className="t">
                      <b>{hit.title}</b>
                      <small>{hit.sub}</small>
                    </span>
                    <span className="go">
                      <Icon name="arrow" />
                    </span>
                  </Link>
                );
              })}
            </div>
          ))
        ) : (
          <div className="empty">
            <span className="halo">
              <Icon name="search" />
            </span>
            <p>Niets gevonden voor &ldquo;{query}&rdquo;. Probeer een naam, vakgebied of plaats.</p>
          </div>
        )}
      </div>
      <div className="foot" aria-hidden="true">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd>kiezen
        </span>
        <span>
          <kbd>↵</kbd>openen
        </span>
        <span>
          <kbd>esc</kbd>sluiten
        </span>
      </div>
    </>
  );
}
