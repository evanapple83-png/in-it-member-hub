"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Cover } from "@/components/app/Cover";
import { SignOutButton } from "@/components/access/SignOutButton";
import { Icon } from "@/components/ui/icon";

const POLL_MS = 30_000;
const OPEN = new Set(["approved", "active"]);

export type WaitInfo = {
  firstName: string;
  linkedinName: string;
  profileLine: string;
  codeLine: string;
  triedPath: string | null;
};

// Pending screen that checks GET /api/me every 30 seconds (and when the tab regains focus).
// On approval it turns into the welcome state in place; other outcomes re-render the server page.
export function WaitStatus({ info }: { info: WaitInfo }) {
  const router = useRouter();
  const [approved, setApproved] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    if (approved) return;
    let stopped = false;
    async function check() {
      if (busy.current || stopped || document.visibilityState === "hidden") return;
      busy.current = true;
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (res.status === 401) return router.refresh();
        if (!res.ok) return;
        const { member } = await res.json();
        if (stopped) return;
        if (!member) return router.refresh();
        if (OPEN.has(member.visibility_status) && member.consent_given) setApproved(true);
        else if (member.visibility_status !== "pending") router.refresh();
      } catch {
        // Offline for a moment: the next round tries again.
      } finally {
        busy.current = false;
      }
    }
    const id = window.setInterval(check, POLL_MS);
    const onFocus = () => void check();
    const onVisible = () => document.visibilityState === "visible" && void check();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [approved, router]);

  return (
    <div className="screen wait enter">
      <div className={`wcard${approved ? " approved" : ""}`}>
        <Cover crop={approved ? "c-wide" : "c-wave"} />
        <div className="wb">
          {info.triedPath && !approved ? (
            <div className="note">
              <Icon name="lock" />
              <span>
                Je probeerde <b>{info.triedPath}</b> te openen. Tot je bent goedgekeurd kom je steeds hier uit.
              </span>
            </div>
          ) : null}
          <div aria-live="polite">
            <h1>{approved ? `Welkom, ${info.firstName}. Je bent binnen.` : "Je aanvraag ligt bij de coördinator"}</h1>
            <p className="sub" style={{ marginTop: 6 }}>
              {approved
                ? "Je profiel is goedgekeurd. Vanaf nu log je op elk apparaat in met LinkedIn, zonder code."
                : "Meestal binnen een dag. Deze pagina gaat vanzelf open zodra je bent goedgekeurd."}
            </p>
          </div>
          <ol className="tl">
            <Step done title="Uitnodigingscode" detail={info.codeLine} />
            <Step done title="Account via LinkedIn" detail={info.linkedinName} />
            <Step done title="Profiel ingevuld" detail={info.profileLine} />
            <li className={approved ? "done pop" : "now"} aria-current={approved ? undefined : "step"}>
              <span className="dot">{approved ? <Icon name="check" /> : null}</span>
              <span>
                <b>{approved ? "Goedgekeurd" : "Beoordeling door de coördinator"}</b>
                <small>{approved ? "Zojuist" : "Bezig"}</small>
              </span>
            </li>
          </ol>
          {approved ? (
            <div className="wcta">
              <Link className="btn primary" href="/vandaag">
                Naar de community
                <Icon name="arrow" />
              </Link>
            </div>
          ) : (
            <>
              <div className="poll">
                <span className="spin" aria-hidden="true" />
                We kijken elke 30 seconden of je bent goedgekeurd.
              </div>
              <div className="wcta">
                <Link className="btn ghost" href="/onboarding">
                  <Icon name="pen" />
                  Profiel aanpassen
                </Link>
                <SignOutButton />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ done, title, detail }: { done: boolean; title: string; detail: string }) {
  return (
    <li className={done ? "done" : undefined}>
      <span className="dot">{done ? <Icon name="check" /> : null}</span>
      <span>
        <b>{title}</b>
        <small>{detail}</small>
      </span>
    </li>
  );
}
