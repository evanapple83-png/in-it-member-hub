"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/app/Toast";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

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

  async function toggle() {
    if (busy) return;
    const next = !joined;
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

  const label = joined ? (size === "sm" ? "Lid" : "Je bent lid") : "Word lid";
  return (
    <button
      type="button"
      className={cn("btn", size === "sm" && "sm", joined ? "joined" : size === "sm" ? "ghost" : "primary")}
      onClick={toggle}
      aria-pressed={joined}
      aria-label={joined ? `Lid van ${name}. Klik om te verlaten` : `Word lid van ${name}`}
      title={joined ? "Klik om de groep te verlaten" : undefined}
    >
      {joined ? <Icon name="check" key="on" /> : null}
      {label}
    </button>
  );
}
