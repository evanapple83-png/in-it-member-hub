"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type LayerKind = "pop" | "sheet" | "cmdk" | "modal";

// One overlay (scrim + box) with the spec's enter/exit: mount, add `.show` next frame,
// remove `.show` on close and unmount after the transition. Focus moves in and back out.
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
  const [show, setShow] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      const frame = requestAnimationFrame(() => {
        setShow(true);
        const target = boxRef.current?.querySelector<HTMLElement>("[data-autofocus], input, a[href], button");
        target?.focus({ preventScroll: true });
      });
      return () => cancelAnimationFrame(frame);
    }
    const frame = requestAnimationFrame(() => setShow(false));
    const timer = window.setTimeout(() => {
      // Only hand focus back if it is still ours (another overlay may have taken it).
      const current = document.activeElement;
      if (!current || current === document.body || boxRef.current?.contains(current)) {
        returnFocus.current?.focus?.({ preventScroll: true });
      }
      returnFocus.current = null;
      setMounted(false);
    }, 220);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [open]);

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
      <div className={show ? "scrim show" : "scrim"} onClick={onClose} aria-hidden="true" />
      <div
        ref={boxRef}
        className={show ? `${kind} show` : kind}
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
