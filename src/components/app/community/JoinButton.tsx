"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useToast } from "@/components/app/Toast";
import { EASE_OUT, gsap, prefersReduced, useGSAP } from "@/components/motion/gsap";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

// Last toggle, so a JoinButton that the parent remounts right after a toggle (keyed on the joined
// state) still plays the label crossfade instead of snapping.
let lastToggle: { slug: string; at: number } | null = null;

// Word lid / Lid toggle for a group. Refreshes the server data (sidebar "Mijn groepen", counts).
export function JoinButton({
  slug,
  name,
  joined: initial,
  size = "sm",
  onChange,
}: {
  slug: string;
  name: string;
  joined: boolean;
  size?: "sm" | "md";
  onChange?: (joined: boolean) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [joined, setJoined] = useState(initial);
  const [busy, setBusy] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const shown = useRef<boolean | null>(null);

  // Label morph: both labels are stacked in one grid cell (the button keeps the width of the
  // widest), so the change is an opacity/transform crossfade, never a width animation.
  useGSAP(
    () => {
      const button = buttonRef.current;
      const previous = shown.current;
      shown.current = joined;
      if (!button || previous === joined) return; // no change (or StrictMode's re-run)
      const remountedByToggle = lastToggle?.slug === slug && performance.now() - lastToggle.at < 800;
      if (previous === null && !remountedByToggle) return; // first paint: no morph
      const incoming = button.querySelector<HTMLElement>(`[data-label="${joined ? "on" : "off"}"]`);
      const outgoing = button.querySelector<HTMLElement>(`[data-label="${joined ? "off" : "on"}"]`);
      const reduced = prefersReduced();
      if (outgoing) gsap.fromTo(outgoing, { opacity: 1, y: 0 }, { opacity: 0, y: reduced ? 0 : -6, duration: 0.14, ease: EASE_OUT });
      if (incoming) gsap.fromTo(incoming, { opacity: 0, y: reduced ? 0 : 6 }, { opacity: 1, y: 0, duration: reduced ? 0.14 : 0.22, delay: 0.04, ease: EASE_OUT, clearProps: "opacity,transform" });
      const check = joined ? incoming?.querySelector("svg") : null;
      if (check && !reduced) gsap.fromTo(check, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, delay: 0.06, ease: "back.out(2)", clearProps: "opacity,transform" });
    },
    { dependencies: [joined], scope: buttonRef },
  );

  async function toggle() {
    if (busy) return;
    const next = !joined;
    lastToggle = { slug, at: performance.now() };
    setBusy(true);
    setJoined(next);
    onChange?.(next);
    const response = await fetch(`/api/communities/${slug}/membership`, { method: next ? "POST" : "DELETE" }).catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setJoined(!next);
      onChange?.(!next);
      toast("Dat lukte niet. Probeer het zo nog eens");
      return;
    }
    toast(next ? `Welkom in ${name}` : `Je hebt ${name} verlaten`);
    router.refresh();
  }

  const joinedLabel = size === "sm" ? "Lid" : "Je bent lid";
  return (
    <button
      ref={buttonRef}
      type="button"
      data-press
      className={cn("btn", size === "sm" && "sm", joined ? "joined" : size === "sm" ? "ghost" : "primary")}
      onClick={toggle}
      aria-pressed={joined}
      aria-label={joined ? `Lid van ${name}. Klik om te verlaten` : `Word lid van ${name}`}
      title={joined ? "Klik om de groep te verlaten" : undefined}
    >
      <span className="lbl">
        <span data-label="on" aria-hidden={!joined} style={joined ? undefined : { opacity: 0 }} className="lbl-in">
          <Icon name="check" />
          {joinedLabel}
        </span>
        <span data-label="off" aria-hidden={joined} style={joined ? { opacity: 0 } : undefined} className="lbl-in">
          Word lid
        </span>
      </span>
    </button>
  );
}
