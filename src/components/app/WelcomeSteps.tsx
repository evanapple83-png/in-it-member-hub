"use client";

import Link from "next/link";
import { useRef } from "react";
import { EASE_OUT, gsap, prefersReduced, useGSAP } from "@/components/motion/gsap";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export type WelcomeStep = { key: string; label: string; href: string; done: boolean };

// Vandaag's three welcome steps. As the block enters, the done checks pop in one after another and
// the progress bar grows to its value (scaleX, never width).
export function WelcomeSteps({ steps }: { steps: WelcomeStep[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const done = steps.filter((step) => step.done).length;

  useGSAP(
    () => {
      if (prefersReduced()) return;
      const checks = gsap.utils.toArray<HTMLElement>(".step.done .ck svg");
      const bar = ref.current?.querySelector<HTMLElement>(".progress i");
      if (checks.length) {
        gsap.fromTo(checks, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.32, ease: "back.out(2.2)", stagger: 0.08, delay: 0.3, clearProps: "opacity,transform" });
      }
      if (bar) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: done / steps.length, duration: 0.55, ease: EASE_OUT, delay: 0.25 });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} style={{ display: "contents" }}>
      <div className="steps">
        {steps.map((step) => (
          <Link key={step.key} href={step.href} className={cn("step", step.done && "done")} data-press>
            <span className="ck">
              <Icon name="check" />
            </span>
            {step.label}
          </Link>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label="Voortgang">
          <i style={{ transform: `scaleX(${done / steps.length})` }} />
        </div>
        <small className="muted num" data-count>
          {done} van {steps.length}
        </small>
      </div>
    </div>
  );
}
