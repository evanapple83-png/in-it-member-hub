"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

type Item = { href: string; label: string };

// Mobile menu for the public navbar: a toggle button and a dropdown panel with the links.
export function MobileNav({ items, primary, secondary }: { items: Item[]; primary: Item; secondary: Item }) {
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close after navigating (the pathname changed since the menu opened).
  if (open && openedAt !== null && openedAt !== pathname) {
    setOpen(false);
    setOpenedAt(null);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onClick = (event: MouseEvent) => {
      if (!panelRef.current?.parentElement?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/55 bg-white/58 text-charcoal shadow-[0_18px_60px_rgba(16,54,92,0.12)] backdrop-blur-2xl"
        aria-label={open ? "Menu sluiten" : "Menu openen"}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => {
          setOpen((value) => !value);
          setOpenedAt(pathname);
        }}
      >
        <Icon name={open ? "x" : "menu"} size={20} />
      </button>
      <div
        ref={panelRef}
        id="mobile-nav-panel"
        hidden={!open}
        className="absolute right-0 top-12 w-64 rounded-3xl border border-white/55 bg-white/95 p-2 shadow-[0_18px_60px_rgba(16,54,92,0.16)] backdrop-blur-2xl"
      >
        <nav className="grid gap-1" aria-label="Menu">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-semibold text-charcoal/80 transition hover:bg-charcoal/5 hover:text-charcoal"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-2 grid gap-2 border-t border-charcoal/10 pt-2">
          <Link href={secondary.href} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-semibold text-charcoal/80 hover:bg-charcoal/5">
            {secondary.label}
          </Link>
          <Link href={primary.href} onClick={() => setOpen(false)} className="rounded-2xl bg-deep-blue px-4 py-3 text-center text-sm font-semibold text-white hover:bg-deep-blue/90">
            {primary.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
