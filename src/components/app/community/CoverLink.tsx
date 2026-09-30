"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type CSSProperties, type MouseEvent, type ReactNode } from "react";

// Shared-cover page transition: the clicked card's cover morphs into the detail header
// (View Transitions API, `hero-cover` in app.css). Browsers without the API, reduced motion
// and modified clicks fall back to a normal navigation; `.main` then just fades.

let settle: (() => void) | null = null;

function finish() {
  const done = settle;
  settle = null;
  done?.();
}

type VTDocument = Document & { startViewTransition?: (cb: () => Promise<void>) => unknown };

export function CoverLink({
  href,
  className,
  style,
  children,
  "aria-label": ariaLabel,
}: {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const router = useRouter();

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    const doc = document as VTDocument;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    const cover = event.currentTarget.querySelector<HTMLElement>("[data-cover]");
    // A detail header left in the DOM would carry the same name; only the clicked cover may.
    document.querySelectorAll<HTMLElement>("[data-hero]").forEach((el) => (el.style.viewTransitionName = "none"));
    if (cover) cover.style.viewTransitionName = "hero-cover";
    doc.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
          router.push(href);
          window.setTimeout(finish, 1500);
        }),
    );
  }

  return (
    <Link href={href} className={className} style={style} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

// Rendered by the detail page: tells a pending transition the new header is in the DOM.
export function HeroSettle() {
  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-hero]").forEach((el) => (el.style.viewTransitionName = "hero-cover"));
    const id = window.requestAnimationFrame(finish);
    return () => window.cancelAnimationFrame(id);
  }, []);
  return null;
}
