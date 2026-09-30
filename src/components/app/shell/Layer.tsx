"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { EASE_OUT, EASE_SOFT, gsap, prefersReduced, useGSAP } from "@/components/motion/gsap";

export type LayerKind = "pop" | "sheet" | "cmdk" | "modal";

// Hidden ("from") state per kind. CSS holds the shown state (`.show`); GSAP only plays the way in
// and out, then clears its inline styles. Popovers scale from their trigger (transformOrigin from
// popStyle), the palette and modals from their own centre, the sheet slides up.
function hiddenState(kind: LayerKind, box: HTMLElement, reduced: boolean): gsap.TweenVars {
  if (reduced) return { opacity: 0 };
  if (kind === "sheet") return { yPercent: 100 };
  if (kind === "modal" && getComputedStyle(box).bottom === "0px") return { opacity: 0, y: 24 }; // bottom sheet on mobile
  return { opacity: 0, scale: kind === "pop" ? 0.96 : 0.97 };
}

// One overlay (scrim + box). Mounts on open, animates in with GSAP, animates out on close and
// unmounts when the exit finishes. Focus moves in and back out.
export function Layer({
  open,
  kind,
  onClose,
  style,
  label,
  children,
}: {
  open: boolean;
  kind: LayerKind;
  onClose: () => void;
  style?: CSSProperties;
  label: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const boxRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  if (open && !mounted) setMounted(true);

  useGSAP(
    () => {
      const box = boxRef.current;
      const scrim = scrimRef.current;
      if (!box || !scrim) return;
      const reduced = prefersReduced();
      const hidden = hiddenState(kind, box, reduced);

      if (open) {
        returnFocus.current = document.activeElement as HTMLElement | null;
        gsap.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: reduced ? 0.12 : 0.18, ease: EASE_SOFT, clearProps: "opacity" });
        gsap.fromTo(box, hidden, {
          opacity: 1,
          scale: 1,
          y: 0,
          yPercent: 0,
          duration: reduced ? 0.12 : kind === "sheet" ? 0.34 : kind === "modal" ? 0.22 : 0.18,
          ease: kind === "sheet" ? "expo.out" : EASE_OUT,
          clearProps: "opacity,transform",
        });
        // Palette results settle in just after the box (first 8 only, opening is not typing).
        if (kind === "cmdk" && !reduced) {
          const items = Array.from(box.querySelectorAll<HTMLElement>(".it")).slice(0, 8);
          if (items.length) gsap.fromTo(items, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.2, stagger: 0.018, delay: 0.04, ease: EASE_OUT, clearProps: "opacity,transform" });
        }
        const frame = requestAnimationFrame(() => {
          const target = box.querySelector<HTMLElement>("[data-autofocus], input, a[href], button");
          target?.focus({ preventScroll: true });
        });
        return () => cancelAnimationFrame(frame);
      }

      const unmount = () => {
        // Only hand focus back if it is still ours (another overlay may have taken it).
        const current = document.activeElement;
        if (!current || current === document.body || box.contains(current)) {
          returnFocus.current?.focus?.({ preventScroll: true });
        }
        returnFocus.current = null;
        setMounted(false);
      };
      gsap.to(scrim, { opacity: 0, duration: 0.14, ease: EASE_SOFT });
      gsap.to(box, { ...hidden, duration: reduced ? 0.1 : kind === "sheet" ? 0.22 : 0.14, ease: EASE_SOFT, onComplete: unmount });
    },
    { dependencies: [open, mounted], revertOnUpdate: true },
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;
  return (
    <>
      <div ref={scrimRef} className="scrim show" data-gsap onClick={onClose} aria-hidden="true" />
      <div
        ref={boxRef}
        className={`${kind} show`}
        data-gsap
        style={style}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {kind === "sheet" ? <div className="grab" /> : null}
        {children}
      </div>
    </>
  );
}

// Position a `.pop` under its trigger, inside the app frame (same math as the prototype).
export function popStyle(anchor: HTMLElement | null, frame: HTMLElement | null, align: "left" | "right" = "right"): CSSProperties {
  if (!anchor || !frame) return {};
  const a = anchor.getBoundingClientRect();
  const r = frame.getBoundingClientRect();
  const width = Math.min(340, r.width - 24);
  const rawLeft = align === "right" ? a.right - r.left - width : a.left - r.left;
  const left = Math.max(12, Math.min(rawLeft, r.width - width - 12));
  const origin = Math.min(width - 20, Math.max(20, a.left + a.width / 2 - r.left - left));
  return { width, top: a.bottom - r.top + 8, left, transformOrigin: `${origin}px top` };
}
