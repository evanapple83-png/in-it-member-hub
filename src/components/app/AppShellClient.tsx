"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Avatar } from "@/components/app/Avatar";
import { CommandPalette } from "@/components/app/CommandPalette";
import { cropFor } from "@/components/app/Cover";
import { EmptyState } from "@/components/app/EmptyState";
import { ToastProvider } from "@/components/app/Toast";
import { Layer, popStyle } from "@/components/app/shell/Layer";
import { MenuItem } from "@/components/app/shell/MenuItem";
import { SideNav, TabBar, activeIndex, type NavItem } from "@/components/app/shell/SideNav";
import { Icon } from "@/components/ui/icon";
import type { SearchIndex, ShellGroup } from "@/lib/shell-data";

export type ShellMe = { id: string; name: string; photoUrl: string | null; isAdmin: boolean; profileHref: string };

type OverlayState = { kind: "cmdk" | "share" | "bell" | "me"; mode: "pop" | "sheet" | "cmdk"; style?: CSSProperties } | null;

// Client side of the member hub shell: sidebar, topbar, mobile tabs and the overlays.
export function AppShellClient({
  me,
  agendaCount,
  groups,
  searchIndex,
  children,
}: {
  me: ShellMe;
  agendaCount: number;
  groups: ShellGroup[];
  searchIndex: SearchIndex;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const frameRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const close = useCallback(() => setOverlay(null), []);

  const nav: NavItem[] = [
    { href: "/vandaag", label: "Vandaag", icon: "home" },
    { href: "/members", label: "Leden", icon: "users" },
    { href: "/communities", label: "Groepen", icon: "groups" },
    { href: "/agenda", label: "Agenda", icon: "cal", count: agendaCount },
    { href: "/blog", label: "Verhalen", icon: "book" },
  ];
  const onOwnProfile = pathname === me.profileHref;
  const active = onOwnProfile ? -1 : activeIndex(nav, pathname);

  // Open a menu as a popover under its trigger, or as a bottom sheet on narrow screens.
  const openMenu = (kind: "share" | "bell" | "me", trigger: HTMLElement, align: "left" | "right" = "right") => {
    const narrow = (frameRef.current?.offsetWidth ?? 1000) <= 700;
    setOverlay(narrow ? { kind, mode: "sheet" } : { kind, mode: "pop", style: popStyle(trigger, frameRef.current, align) });
  };

  // ⌘K / Ctrl+K opens search from anywhere in the hub.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOverlay({ kind: "cmdk", mode: "cmdk" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The main area is the scroller, so reset it on every page change.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  const roleLabel = me.isAdmin ? "Beheerder" : "Lid";
  const sheet = overlay?.mode === "sheet";

  return (
    <div className="app ui" lang="nl" ref={frameRef}>
      <ToastProvider>
        <div className="screen hub">
          <aside className="side">
            <Link href="/vandaag" className="brand">
              <Image src="/in-it-logo.png" alt="" width={34} height={34} priority />
              IN-IT
            </Link>
            <SideNav items={nav} active={active} label="Hoofdmenu" />
            <h5>Mijn groepen</h5>
            <div className="mine">
              {groups.length ? (
                groups.map((group) => (
                  <Link key={group.slug} href={`/communities/${group.slug}`}>
                    <span className={`cv cover ${cropFor(group.slug)}`} aria-hidden="true" />
                    {group.name}
                  </Link>
                ))
              ) : (
                <p className="mine-empty">Word lid van een groep, dan staat hij hier.</p>
              )}
            </div>
            <div className="grow" />
            <button className="out" type="button" onClick={() => signOut({ callbackUrl: "/" })}>
              <Icon name="logout" />
              Uitloggen
            </button>
          </aside>

          <header className="top">
            <Link href="/vandaag" className="brand-m">
              <Image src="/in-it-logo.png" alt="" width={30} height={30} />
              IN-IT
            </Link>
            <button className="search" type="button" onClick={() => setOverlay({ kind: "cmdk", mode: "cmdk" })} aria-label="Zoeken">
              <Icon name="search" className="mob-only" />
              <span>Zoek leden, groepen, activiteiten</span>
              <kbd>⌘K</kbd>
              <i className="go">
                <Icon name="search" />
              </i>
            </button>
            <div className="sp" />
            <button className="btn primary desk-only" type="button" data-press onClick={(e) => openMenu("share", e.currentTarget)} aria-haspopup="dialog">
              <Icon name="plus" />
              Deel iets
            </button>
            <button className="icon-btn" type="button" onClick={(e) => openMenu("bell", e.currentTarget)} aria-label="Meldingen" aria-haspopup="dialog">
              <Icon name="bell" />
            </button>
            <button className="me" type="button" onClick={(e) => openMenu("me", e.currentTarget)} aria-label="Mijn account" aria-haspopup="dialog">
              <Avatar name={me.name} photoUrl={me.photoUrl} id={me.id} />
              <span className="desk-only">
                <b>{me.name}</b>
                <small>{roleLabel}</small>
              </span>
            </button>
          </header>

          <main className="main" ref={mainRef} id="main" data-motion-page>
            {children}
          </main>

          <TabBar items={nav} active={active} label="Hoofdmenu mobiel" />

          <Layer open={overlay?.kind === "cmdk"} kind="cmdk" onClose={close} label="Zoeken">
            <CommandPalette index={searchIndex} onDone={close} />
          </Layer>

          <Layer open={overlay?.kind === "share"} kind={sheet ? "sheet" : "pop"} style={overlay?.style} onClose={close} label="Deel iets">
            <h6>Deel iets</h6>
            <MenuItem icon="chat" title="Bericht in een groep" hint="Een vraag, tip of link voor vakgenoten" href="/communities" onClick={close} />
            <MenuItem icon="pen" title="Verhaal schrijven" hint="Een project, overstap of les, voor alle leden" href="/blog/schrijven" onClick={close} />
          </Layer>

          <Layer open={overlay?.kind === "bell"} kind={sheet ? "sheet" : "pop"} style={overlay?.style} onClose={close} label="Meldingen">
            <h6>Meldingen</h6>
            <EmptyState icon="check" text="Je bent bij." compact />
          </Layer>

          <Layer open={overlay?.kind === "me"} kind={sheet ? "sheet" : "pop"} style={overlay?.style} onClose={close} label="Mijn account">
            <MenuItem icon="user" title="Mijn profiel" hint="Zoals andere leden je zien" href={me.profileHref} onClick={close} />
            {sheet ? <MenuItem icon="book" title="Verhalen" hint="Wat leden schrijven" href="/blog" onClick={close} /> : null}
            <MenuItem icon="pen" title="Instellingen" hint="Profiel, privacy en e-mail" href="/profile" onClick={close} />
            <MenuItem icon="info" title="Over IN-IT" hint="De publieke site en contact" href="/about" onClick={close} />
            {me.isAdmin ? <MenuItem icon="grid" title="Beheer" hint="Aanvragen, leden, uitnodigingen" href="/admin" onClick={close} /> : null}
            <MenuItem icon="logout" title="Uitloggen" onClick={() => signOut({ callbackUrl: "/" })} />
          </Layer>
        </div>
      </ToastProvider>
    </div>
  );
}
