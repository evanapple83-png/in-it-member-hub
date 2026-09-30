"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";

export type NavItem = { href: string; label: string; icon: IconName; count?: number; tabLabel?: string };

const ROW = 48; // 44px row + 4px gap, as in `.nav`

// Sidebar nav with the gliding pill (`.nav .ind`). The pill moves with a CSS transition.
export function SideNav({ items, active, label }: { items: NavItem[]; active: number; label: string }) {
  return (
    <nav className="nav" aria-label={label}>
      <span
        className="ind"
        style={{ transform: `translateY(${Math.max(active, 0) * ROW}px)`, opacity: active < 0 ? 0 : 1 }}
      />
      {items.map((item, index) => (
        <Link key={item.href} href={item.href} className={index === active ? "on" : undefined} aria-current={index === active ? "page" : undefined}>
          <Icon name={item.icon} />
          {item.label}
          {item.count ? (
            <span className="count num" aria-label={`${item.count} open`}>
              {item.count}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

// Mobile bottom tabs (first four items) with the gliding soft-accent block.
export function TabBar({ items, active, label }: { items: NavItem[]; active: number; label: string }) {
  const tabs = items.slice(0, 4);
  const on = active >= 0 && active < tabs.length;
  return (
    <nav className="tabs" aria-label={label}>
      <span className="ind" style={{ transform: `translateX(${Math.max(active, 0) * 100}%)`, opacity: on ? 1 : 0 }} />
      {tabs.map((item, index) => (
        <Link key={item.href} href={item.href} className={index === active ? "on" : undefined} aria-current={index === active ? "page" : undefined}>
          <Icon name={item.icon} />
          {item.tabLabel ?? item.label}
        </Link>
      ))}
    </nav>
  );
}

// Index of the nav item that owns the pathname (longest prefix), or -1.
export function activeIndex(items: { href: string }[], pathname: string, exact: string[] = []) {
  let best = -1;
  let bestLength = -1;
  items.forEach((item, index) => {
    const isExact = exact.includes(item.href);
    const hit = isExact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
    if (hit && item.href.length > bestLength) {
      best = index;
      bestLength = item.href.length;
    }
  });
  return best;
}
