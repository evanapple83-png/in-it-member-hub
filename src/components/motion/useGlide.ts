"use client";

import { useRef } from "react";
import { EASE_OUT, gsap, prefersReduced, useGSAP } from "./gsap";

// Glides an indicator (nav pill, tab block, segmented thumb) to `active * step` on its axis.
// The server render positions it with CSS (`--i`), so it is right without JS; after that GSAP owns
// its transform. Opacity stays CSS ([data-off]). Showing from hidden jumps instead of gliding.
export function useGlide<T extends HTMLElement>(active: number, axis: "y" | "xPercent", step: number, ease = EASE_OUT) {
  const ref = useRef<T>(null);
  const last = useRef(active);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || active < 0 || active === last.current) return;
      const fromHidden = last.current < 0;
      last.current = active;
      // xPercent also zeroes the px offset GSAP parsed from the CSS start position.
      const to = axis === "xPercent" ? { xPercent: active * step, x: 0 } : { y: active * step };
      if (fromHidden || prefersReduced()) gsap.set(el, to);
      else gsap.to(el, { ...to, duration: 0.3, ease, overwrite: true });
    },
    { dependencies: [active] },
  );
  return ref;
}
