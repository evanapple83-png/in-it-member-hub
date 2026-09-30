"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

type ToastApi = { toast: (message: string) => void };
const ToastContext = createContext<ToastApi | null>(null);

// Provides `useToast()`; renders the navy `.toast` pill. Must sit inside the positioned app frame.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<{ id: number; text: string } | null>(null);
  const [show, setShow] = useState(false);
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const toast = useCallback((text: string) => {
    clear();
    setShow(false);
    setMessage({ id: Date.now(), text });
    timers.current.push(
      window.setTimeout(() => setShow(true), 20),
      window.setTimeout(() => setShow(false), 2300),
      window.setTimeout(() => setMessage(null), 2560),
    );
  }, []);

  useEffect(() => clear, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div aria-live="polite" role="status">
        {message ? (
          <div key={message.id} className={show ? "toast show" : "toast"}>
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
