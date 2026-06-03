"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { RsvpStatus } from "@/lib/types";

const OPTIONS: { value: RsvpStatus; label: string }[] = [
  { value: "going", label: "Aanwezig" },
  { value: "maybe", label: "Misschien" },
  { value: "declined", label: "Niet" },
];

export function RsvpButtons({
  eventId,
  initial,
  goingCount = 0,
}: {
  eventId: string;
  initial: RsvpStatus | null;
  goingCount?: number;
}) {
  const [current, setCurrent] = useState<RsvpStatus | null>(initial);
  const [going, setGoing] = useState(goingCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(status: RsvpStatus) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const previous = current;
    const response = await fetch(`/api/events/${eventId}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Aanmelden mislukt.");
      return;
    }
    // Keep the "going" tally in sync locally.
    setGoing((count) => count + (status === "going" ? 1 : 0) - (previous === "going" ? 1 : 0));
    setCurrent(status);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {OPTIONS.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={current === option.value ? "primary" : "outline"}
            disabled={busy}
            onClick={() => choose(option.value)}
          >
            {option.label}
          </Button>
        ))}
        <span className="ml-1 text-sm font-semibold text-charcoal/55">{going} aanwezig</span>
      </div>
      {error ? <p className="mt-2 text-sm font-semibold text-date">{error}</p> : null}
    </div>
  );
}
