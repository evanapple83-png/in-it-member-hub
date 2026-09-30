"use client";

import { useState } from "react";
import { EmptyState } from "@/components/app/EmptyState";
import { Pills } from "@/components/app/Pills";
import { EventRow, EventTile, FeatureEvent } from "@/components/app/community/cards";
import { capitalize } from "@/lib/format-nl";
import type { CommunityEvent } from "@/lib/types";

// Agenda: category pills with counts, first upcoming as feature, the rest as tiles, past quietly below.
export function AgendaView({ upcoming, past }: { upcoming: CommunityEvent[]; past: CommunityEvent[] }) {
  const [cat, setCat] = useState("alles");
  const cats = Array.from(new Set([...upcoming, ...past].map((event) => event.category)));
  const match = (event: CommunityEvent) => cat === "alles" || event.category === cat;
  const list = upcoming.filter(match);
  const oldList = past.filter(match);
  const [first, ...rest] = list;

  const pills = [
    { key: "alles", label: "Alles", count: upcoming.length },
    ...cats.map((c) => ({ key: c, label: capitalize(c), count: upcoming.filter((event) => event.category === c).length })),
  ];

  return (
    <>
      {cats.length > 1 ? (
        <div className="toolbar" data-reveal>
          <Pills items={pills} active={cat} onChange={setCat} label="Filter op soort activiteit" className="seg-pills" />
        </div>
      ) : null}

      {first ? (
        <FeatureEvent event={first} kicker={first.my_rsvp === "going" ? "Jij gaat" : "Eerstvolgende"} />
      ) : (
        <div className="panel" data-reveal>
          <EmptyState
            icon="cal"
            title={cat === "alles" ? "Nog niets gepland" : "Hier staat nu niets gepland"}
            text={
              cat === "alles"
                ? "Zodra de coördinator een activiteit plant, zie je die hier en kun je je met één klik aanmelden."
                : "Kies een andere soort of kijk bij alles."
            }
          />
        </div>
      )}

      {rest.length ? (
        <div className="tiles three" data-reveal>
          {rest.map((event) => (
            <EventTile key={event.id} event={event} />
          ))}
        </div>
      ) : null}

      {oldList.length ? (
        <section className="panel quiet" data-reveal>
          <div className="ph">
            <h3>
              Geweest{" "}
              <span className="badge num" data-count>
                {oldList.length}
              </span>
            </h3>
          </div>
          <div className="rows">
            {oldList.slice(0, 8).map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
