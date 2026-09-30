"use client";

import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

// One place that registers GSAP plugins; every motion module imports gsap from here.
gsap.registerPlugin(useGSAP);
gsap.config({ nullTargetWarn: false });

export { gsap, useGSAP };

// Strong ease-out for entrances and UI responses (never ease-in on UI).
export const EASE_OUT = "power3.out";
export const EASE_SOFT = "power2.out";

// Read synchronously on every call so the first frame already knows (no hook lag).
export function prefersReduced(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Whether the pointer can hover (lift effects are skipped on touch).
export function canHover(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

// Set by CoverLink while a View Transition (shared cover morph) runs.
export function viewTransitionRunning(): boolean {
  return typeof document !== "undefined" && document.documentElement.hasAttribute("data-vt");
}
