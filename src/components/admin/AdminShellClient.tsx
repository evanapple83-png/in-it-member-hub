"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Avatar } from "@/components/app/Avatar";
import { ToastProvider } from "@/components/app/Toast";
import { Layer, popStyle } from "@/components/app/shell/Layer";
import { MenuItem } from "@/components/app/shell/MenuItem";
import { SideNav, TabBar, activeIndex, type NavItem } from "@/components/app/shell/SideNav";
import { Icon } from "@/components/ui/icon";

type Me = { id: string; name: string; photoUrl: string | null };

// Client side of the beheer shell: navy sidebar, topbar, mobile tabs, account menu.
export function AdminShellClient({ me, openCount, children }: { me: Me; openCount: number; children: ReactNode }) {
  const pathname = usePathname();
  const frameRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [menu, setMenu] = useState<{ mode: "pop" | "sheet"; style?: CSSProperties } | null>(null);
  const close = useCallback(() => setMenu(null), []);

  const nav: NavItem[] = [
    { href: "/admin", label: "Overzicht", icon: "grid" },
    { href: "/admin/requests", label: "Aanvragen", icon: "inbox", count: openCount },
    { href: "/admin/members", label: "Leden", icon: "users" },
    { href: "/admin/invites", label: "Uitnodigingen", icon: "key", tabLabel: "Codes" },
    { href: "/admin/communities", label: "Groepen", icon: "groups" },
    { href: "/admin/events", label: "Activiteiten", icon: "cal" },
  ];
  // /admin/members/pending is part of Aanvragen; /admin itself only matches exactly.
  const active = pathname.startsWith("/admin/members/pending") ? 1 : activeIndex(nav, pathname, ["/admin"]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  const openAccount = (trigger: HTMLElement) => {
    const narrow = (frameRef.current?.offsetWidth ?? 1000) <= 700;
    setMenu(narrow ? { mode: "sheet" } : { mode: "pop", style: popStyle(trigger, frameRef.current) });
  };

  return (
    <div className="app ui" lang="nl" ref={frameRef}>
      <ToastProvider>
        <div className="screen admin">
          <aside className="side">
            <Link href="/admin" className="brand">
              <Image src="/in-it-logo.png" alt="" width={34} height={34} priority />
              <span>
                IN-IT<small>Beheer</small>
              </span>
            </Link>
            <SideNav items={nav} active={active} label="Beheermenu" />
            <div className="grow" />
            <Link className="out" href="/vandaag">
              <Icon name="back" />
              Naar de community
            </Link>
          </aside>

          <header className="top">
            <Link href="/admin" className="brand-m">
              <Image src="/in-it-logo.png" alt="" width={30} height={30} />
              Beheer
            </Link>
            <Link className="search" href="/admin/members" aria-label="Zoek een lid">
              <Icon name="search" className="mob-only" />
              <span>Zoek een lid of code</span>
              <i className="go">
                <Icon name="search" />
              </i>
            </Link>
            <div className="sp" />
            <Link className="btn primary" href="/admin/invites?new=1">
              <Icon name="plus" />
              <span className="desk-only">Nieuwe uitnodiging</span>
              <span className="mob-only sr-only-x">Nieuwe uitnodiging</span>
            </Link>
            <button className="me" type="button" onClick={(e) => openAccount(e.currentTarget)} aria-label="Mijn account" aria-haspopup="dialog">
              <Avatar name={me.name} photoUrl={me.photoUrl} id={me.id} />
              <span className="desk-only">
                <b>{me.name}</b>
                <small>Beheerder</small>
              </span>
            </button>
          </header>

          <main className="main" ref={mainRef} id="main">
            {children}
          </main>

          <TabBar items={nav} active={active} label="Beheermenu mobiel" />

          <Layer open={Boolean(menu)} kind={menu?.mode === "sheet" ? "sheet" : "pop"} style={menu?.style} onClose={close} label="Mijn account">
            <MenuItem icon="back" title="Naar de community" hint="Terug naar Vandaag" href="/vandaag" onClick={close} />
            <MenuItem icon="user" title="Mijn profiel" hint="Zoals andere leden je zien" href={`/members/${me.id}`} onClick={close} />
            <MenuItem icon="logout" title="Uitloggen" onClick={() => signOut({ callbackUrl: "/" })} />
          </Layer>
        </div>
      </ToastProvider>
    </div>
  );
}
