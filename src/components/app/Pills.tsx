"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type PillItem = {
  key: string;
  label: string;
  /** Shown as a badge; omit for a pill without count. */
  count?: number;
  /** Link-based pill (e.g. a filter in the URL). Without href the pill is a button. */
  href?: string;
};

// Tab/filter pills (`.pills` / `.pill`). Active pill is navy with an accent count badge.
export function Pills({
  items,
  active,
  onChange,
  label,
  className,
}: {
  items: PillItem[];
  active: string;
  onChange?: (key: string) => void;
  /** Accessible name for the group, e.g. "Filter activiteiten". */
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("pills", className)} role="group" aria-label={label}>
      {items.map((item) => {
        const on = item.key === active;
        const cls = cn("pill", on && "on", item.count === undefined && "no-count");
        const inner = (
          <>
            {item.label}
            {item.count !== undefined ? <span className="badge num">{item.count}</span> : null}
          </>
        );
        return item.href ? (
          <Link key={item.key} href={item.href} className={cls} aria-current={on ? "page" : undefined} scroll={false}>
            {inner}
          </Link>
        ) : (
          <button key={item.key} type="button" className={cls} aria-pressed={on} onClick={() => onChange?.(item.key)}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}
