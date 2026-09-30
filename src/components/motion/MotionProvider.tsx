"use client";

import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { EASE_OUT, EASE_SOFT, canHover, gsap, prefersReduced, useGSAP, viewTransitionRunning } from "./gsap";

/*
 * Motion contract (attribute API, no per-component wiring):
 *
 *   data-reveal              fades up (y 14 -> 0, opacity 0 -> 1) when it enters the viewport.
 *   data-reveal-group        parent; its data-reveal descendants that appear together stagger 0.06s.
 *   data-reveal-children     shorthand: every element child is a data-reveal item, the parent their
 *                            group (for slots whose children come from elsewhere, e.g. AuthSplit).
 *   data-hover="lift"        card hover: y -4, CSS shadow pseudo fades in ([data-lifted]),
 *                            inner [data-hover-media] scales 1.035. quickTo, interruptible.
 *   data-press               press feedback: scale .97 on pointerdown, springs back on release.
 *   data-count[="n"]         the number in the text (or the attribute value) rolls to its value
 *                            when it appears (after boot) and whenever it changes.
 *   data-new                 animates in once when inserted (y 8, opacity, .35s), then the
 *                            attribute is removed.
 *   data-motion-page         the <main> that gets the page exit/enter on route changes.
 *
 * Hidden states are only ever set from JS right before animating, so no-JS / SSR / failed JS
 * never leaves content invisible. The one exception is the boot style from <MotionBoot>, which
 * is itself JS and removes itself after 2.5s. Under prefers-reduced-motion everything is an
 * opacity crossfade of at most 150ms, with no movement.
 */

type Variant = "app" | "auth" | "admin";

const STAGGER = 0.06;
const MAX_STEPS = 8; // never cascade beyond the first 8 items of a group
const REVEAL_Y = 14;
export const PENDING_ID = "motion-pending";

type CountState = { value: number; text: string; tween?: gsap.core.Tween };
type LiftState = { y: gsap.QuickToFunc; scale?: gsap.QuickToFunc; media?: HTMLElement | null; idle?: gsap.core.Tween };

const FEATURES: Record<Variant, { lift: boolean; page: "full" | "fade" | null }> = {
  app: { lift: true, page: "full" },
  admin: { lift: false, page: "fade" },
  auth: { lift: false, page: null },
};

function within(node: Node, selector: string): HTMLElement[] {
  if (!(node instanceof HTMLElement)) return [];
  const out = node.matches(selector) ? [node] : [];
  node.querySelectorAll<HTMLElement>(selector).forEach((el) => out.push(el));
  return out;
}

function domOrder(a: Element, b: Element) {
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

// First text node that holds a digit: that node is React's, we only change its nodeValue.
function countNode(el: HTMLElement): Text | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (/\d/.test(n.nodeValue ?? "")) return n as Text;
  return null;
}

function splitNumber(text: string) {
  const match = text.match(/-?\d[\d.]*/);
  if (!match || match.index === undefined) return null;
  return {
    before: text.slice(0, match.index),
    value: Number(match[0].replace(/\./g, "")),
    after: text.slice(match.index + match[0].length),
  };
}

const nl = new Intl.NumberFormat("nl-NL");

export function MotionProvider({ variant = "app", children }: { variant?: Variant; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const lastPath = useRef(pathname);
  const exitTween = useRef<gsap.core.Tween | null>(null);
  const features = FEATURES[variant];

  // Core: observers + delegated listeners, mounted once for the layout's lifetime.
  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || typeof IntersectionObserver === "undefined") {
        document.getElementById(PENDING_ID)?.remove();
        return;
      }
      const touched = new Set<HTMLElement>(); // elements we tweened outside the context, killed on cleanup
      const initialPainted = !document.getElementById(PENDING_ID);
      let booting = true;

      /* ── reveal ── */
      const pendingReveal = new Set<HTMLElement>();
      const hide = (el: HTMLElement) => {
        if (pendingReveal.has(el) || el.dataset.revealed !== undefined) return;
        // A shared-cover view transition already animates this navigation.
        if (viewTransitionRunning()) return void (el.dataset.revealed = "");
        pendingReveal.add(el);
        gsap.set(el, prefersReduced() ? { opacity: 0 } : { opacity: 0, y: REVEAL_Y });
        revealIO.observe(el);
      };
      const revealIO = new IntersectionObserver((entries) => {
        const groups = new Map<Element | null, HTMLElement[]>();
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (!entry.isIntersecting || !pendingReveal.has(el)) continue;
          pendingReveal.delete(el);
          revealIO.unobserve(el);
          const group = el.parentElement?.closest("[data-reveal-group]") ?? null;
          groups.set(group, [...(groups.get(group) ?? []), el]);
        }
        const reduced = prefersReduced();
        groups.forEach((items, group) => {
          items.sort(domOrder).forEach((el, i) => {
            el.dataset.revealed = "";
            touched.add(el);
            gsap.to(el, {
              opacity: 1,
              y: 0,
              duration: reduced ? 0.15 : 0.5,
              delay: reduced || !group ? 0 : Math.min(i, MAX_STEPS) * STAGGER,
              ease: EASE_OUT,
              overwrite: "auto",
              onStart: () => void (el.style.willChange = "transform, opacity"),
              onComplete: () => gsap.set(el, { clearProps: "opacity,willChange" }),
            });
          });
        });
      });

      /* ── counts ── */
      const counts = new WeakMap<HTMLElement, CountState>();
      const countTarget = (el: HTMLElement, text: string) => {
        const attr = el.getAttribute("data-count");
        if (attr && !Number.isNaN(Number(attr))) return Number(attr);
        return splitNumber(text)?.value ?? null;
      };
      const roll = (el: HTMLElement, from: number) => {
        const node = countNode(el);
        const parts = node ? splitNumber(node.nodeValue ?? "") : null;
        const state = counts.get(el);
        if (!node || !parts || !state) return;
        const to = countTarget(el, node.nodeValue ?? "") ?? parts.value;
        state.tween?.kill();
        const write = (v: number) => {
          const text = parts.before + nl.format(Math.round(v)) + parts.after;
          node.nodeValue = text;
          state.text = text;
          state.value = Math.round(v);
        };
        if (from === to || prefersReduced()) return write(to);
        write(from); // before paint, so React's final value never flashes
        const proxy = { v: from };
        touched.add(el);
        state.tween = gsap.to(proxy, {
          v: to,
          duration: Math.abs(to - from) > 3 ? 0.5 : 0.3,
          ease: EASE_SOFT,
          onUpdate: () => write(proxy.v),
          onComplete: () => write(to),
        });
      };
      const countIO = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          countIO.unobserve(el);
          roll(el, 0);
        }
      });
      const registerCount = (el: HTMLElement, rollOnAppear: boolean) => {
        if (counts.has(el)) return;
        const node = countNode(el);
        const parts = node ? splitNumber(node.nodeValue ?? "") : null;
        if (!node || !parts) return;
        counts.set(el, { value: parts.value, text: node.nodeValue ?? "" });
        if (rollOnAppear && !prefersReduced()) countIO.observe(el);
      };
      const countChanged = (el: HTMLElement) => {
        const state = counts.get(el);
        if (!state) return registerCount(el, false);
        const node = countNode(el);
        if (!node || node.nodeValue === state.text) return; // our own write
        roll(el, state.value);
      };

      /* ── data-new ── */
      const enterNew = (el: HTMLElement) => {
        const reduced = prefersReduced();
        touched.add(el);
        gsap.fromTo(
          el,
          { opacity: 0, y: reduced ? 0 : 8 },
          {
            opacity: 1,
            y: 0,
            duration: reduced ? 0.15 : 0.35,
            ease: EASE_OUT,
            onComplete: () => {
              el.removeAttribute("data-new");
              gsap.set(el, { clearProps: "opacity" });
            },
          },
        );
      };

      /* ── scan ── */
      const scan = (node: Node, added: boolean) => {
        within(node, "[data-reveal-children]").forEach((parent) => {
          parent.setAttribute("data-reveal-group", "");
          Array.from(parent.children).forEach((child) => child.setAttribute("data-reveal", ""));
        });
        within(node, "[data-reveal]").forEach(hide);
        within(node, "[data-count]").forEach((el) => registerCount(el, !booting || !initialPainted || Boolean(el.closest("[data-reveal]"))));
        within(node, "[data-new]").forEach((el) => (added ? enterNew(el) : el.removeAttribute("data-new")));
      };
      const forget = (node: Node) => {
        within(node, "[data-reveal], [data-count], [data-new], [data-hover], [data-press]").forEach((el) => {
          pendingReveal.delete(el);
          revealIO.unobserve(el);
          countIO.unobserve(el);
          counts.get(el)?.tween?.kill();
          if (touched.delete(el)) gsap.killTweensOf(el);
        });
      };

      scan(root, false);
      document.getElementById(PENDING_ID)?.remove(); // hidden states are now owned by GSAP
      booting = false;

      const mo = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === "childList") {
            record.removedNodes.forEach(forget);
            if (record.target instanceof HTMLElement && record.target.hasAttribute("data-reveal-children")) {
              record.addedNodes.forEach((n) => n instanceof HTMLElement && n.setAttribute("data-reveal", ""));
            }
            record.addedNodes.forEach((n) => n.isConnected && scan(n, true));
            const host = record.target instanceof HTMLElement ? record.target.closest<HTMLElement>("[data-count]") : null;
            if (host) countChanged(host);
          } else if (record.type === "characterData") {
            const host = record.target.parentElement?.closest<HTMLElement>("[data-count]");
            if (host) countChanged(host);
          } else if (record.type === "attributes" && record.target instanceof HTMLElement) {
            const el = record.target;
            if (record.attributeName === "data-count" && el.hasAttribute("data-count")) countChanged(el);
            if (record.attributeName === "data-reveal" && el.hasAttribute("data-reveal")) hide(el);
          }
        }
      });
      mo.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["data-count", "data-reveal"] });

      /* ── press ── */
      let pressed: HTMLElement | null = null;
      const release = () => {
        const el = pressed;
        pressed = null;
        window.removeEventListener("pointerup", release);
        window.removeEventListener("pointercancel", release);
        if (el) gsap.to(el, { scale: 1, duration: 0.28, ease: "back.out(2.2)", overwrite: "auto", onComplete: () => void (el.style.willChange = "") });
      };
      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0 || prefersReduced()) return;
        const el = (event.target as Element | null)?.closest<HTMLElement>("[data-press]");
        if (!el || !root.contains(el) || el.matches(":disabled, [aria-disabled='true']")) return;
        pressed = el;
        touched.add(el);
        el.style.willChange = "transform";
        gsap.to(el, { scale: 0.97, duration: 0.12, ease: EASE_SOFT, overwrite: "auto" });
        window.addEventListener("pointerup", release);
        window.addEventListener("pointercancel", release);
      };

      /* ── hover lift ── */
      const lifts = new WeakMap<HTMLElement, LiftState>();
      const liftOf = (card: HTMLElement) => {
        let state = lifts.get(card);
        if (!state) {
          const media = card.querySelector<HTMLElement>("[data-hover-media]");
          state = {
            y: gsap.quickTo(card, "y", { duration: 0.3, ease: EASE_OUT }),
            media,
            scale: media ? gsap.quickTo(media, "scale", { duration: 0.3, ease: EASE_OUT }) : undefined,
          };
          lifts.set(card, state);
        }
        return state;
      };
      const cardFrom = (event: PointerEvent) => {
        if (event.pointerType !== "mouse" || !canHover() || prefersReduced()) return null;
        const card = (event.target as Element | null)?.closest<HTMLElement>('[data-hover="lift"]');
        if (!card || !root.contains(card)) return null;
        const other = event.relatedTarget as Node | null;
        return other && card.contains(other) ? null : card; // moving inside the card
      };
      const onOver = (event: PointerEvent) => {
        const card = cardFrom(event);
        if (!card) return;
        const state = liftOf(card);
        state.idle?.kill();
        touched.add(card);
        if (state.media) touched.add(state.media);
        card.style.willChange = "transform";
        if (state.media) state.media.style.willChange = "transform";
        card.setAttribute("data-lifted", "");
        state.y(-4);
        state.scale?.(1.035);
      };
      const onOut = (event: PointerEvent) => {
        const card = cardFrom(event);
        if (!card) return;
        const state = liftOf(card);
        card.removeAttribute("data-lifted");
        state.y(0);
        state.scale?.(1);
        state.idle = gsap.delayedCall(0.35, () => {
          card.style.willChange = "";
          if (state.media) state.media.style.willChange = "";
        });
      };

      /* ── page exit (on internal link click) ── */
      const onClick = (event: MouseEvent) => {
        if (!features.page || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
        if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
        const url = new URL(link.href, location.href);
        if (url.origin !== location.origin || url.pathname === location.pathname) return;
        const main = root.querySelector<HTMLElement>("[data-motion-page]");
        if (!main) return;
        // Let CoverLink claim the navigation first (it flags a running view transition).
        queueMicrotask(() => {
          if (viewTransitionRunning()) return;
          exitTween.current?.kill();
          exitTween.current = gsap.to(main, {
            opacity: 0,
            duration: prefersReduced() ? 0.1 : 0.12,
            ease: EASE_SOFT,
          });
          // Navigation aborted or slow to resolve: never leave the page blank.
          gsap.delayedCall(1.6, () => {
            if (exitTween.current && main.style.opacity === "0") {
              exitTween.current = null;
              gsap.to(main, { opacity: 1, duration: 0.15, clearProps: "opacity" });
            }
          });
        });
      };

      root.addEventListener("pointerdown", onPointerDown);
      root.addEventListener("click", onClick);
      if (features.lift) {
        root.addEventListener("pointerover", onOver);
        root.addEventListener("pointerout", onOut);
      }

      return () => {
        mo.disconnect();
        revealIO.disconnect();
        countIO.disconnect();
        release();
        root.removeEventListener("pointerdown", onPointerDown);
        root.removeEventListener("click", onClick);
        root.removeEventListener("pointerover", onOver);
        root.removeEventListener("pointerout", onOut);
        touched.forEach((el) => gsap.killTweensOf(el));
        touched.clear();
      };
    },
    { scope: rootRef },
  );

  // Page enter on route change. Sidebar and topbar stay still: only [data-motion-page] moves.
  useGSAP(
    () => {
      if (lastPath.current === pathname) return; // first mount (and StrictMode's re-run)
      lastPath.current = pathname;
      const main = rootRef.current?.querySelector<HTMLElement>("[data-motion-page]");
      if (!main || !features.page) return;
      const exiting = exitTween.current;
      exitTween.current = null;
      exiting?.kill();
      if (viewTransitionRunning()) {
        // The shared-cover morph already animates `main`; do not double-animate.
        gsap.set(main, { clearProps: "opacity,transform" });
        return;
      }
      const reduced = prefersReduced();
      const from = exiting ? Number(gsap.getProperty(main, "opacity")) : 0;
      const move = features.page === "full" && !reduced;
      gsap.fromTo(
        main,
        { opacity: from, y: move ? 10 : 0 },
        {
          opacity: 1,
          y: 0,
          duration: reduced ? 0.15 : move ? 0.32 : 0.2,
          ease: EASE_OUT,
          onStart: () => void (main.style.willChange = "transform, opacity"),
          clearProps: "opacity,transform,willChange",
        },
      );
    },
    { dependencies: [pathname], scope: rootRef },
  );

  return (
    <div ref={rootRef} data-motion-root={variant} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
