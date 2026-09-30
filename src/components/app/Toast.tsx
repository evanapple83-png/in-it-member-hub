"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { EASE_OUT, EASE_SOFT, gsap, prefersReduced, useGSAP } from "@/components/motion/gsap";
import { Icon } from "@/components/ui/icon";

type ToastApi = { toast: (message: string) => void };
const ToastContext = createContext<ToastApi | null>(null);

// Provides `useToast()`; renders the navy `.toast` pill. Must sit inside the positioned app frame.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<{ id: number; text: string } | null>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  const toast = useCallback((text: string) => setMessage({ id: Date.now(), text }), []);

  // Slide up + fade in, hold, slide down + fade out, then unmount. A new toast replaces the old
  // one (new key), so a quick second toast interrupts cleanly.
  useGSAP(
    () => {
      const el = toastRef.current;
      if (!el || !message) return;
      const reduced = prefersReduced();
      const tl = gsap.timeline({ onComplete: () => setMessage((current) => (current?.id === message.id ? null : current)) });
      tl.fromTo(el, { opacity: 0, y: reduced ? 0 : 12 }, { opacity: 1, y: 0, duration: reduced ? 0.12 : 0.26, ease: EASE_OUT })
        .to(el, { opacity: 0, y: reduced ? 0 : 8, duration: reduced ? 0.12 : 0.2, ease: EASE_SOFT }, "+=2.1");
      // Pause while the tab is hidden, so a toast is never missed.
      const onVisibility = () => (document.hidden ? tl.pause() : tl.resume());
      document.addEventListener("visibilitychange", onVisibility);
      return () => document.removeEventListener("visibilitychange", onVisibility);
    },
    { dependencies: [message?.id], revertOnUpdate: true },
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div aria-live="polite" role="status">
        {message ? (
          <div key={message.id} ref={toastRef} className="toast show" data-gsap>
            <Icon name="check" />
            {message.text}
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

// `const { toast } = useToast(); toast("Opgeslagen");`
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
