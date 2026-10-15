import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { KeyRound, Link2, Sparkles } from "lucide-react";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { getApprovedCurrentMember } from "@/lib/access";
import { getDb, hasDatabase } from "@/db";
import { admins } from "@/db/schema";

const privateNavItems = [
  { href: "/members", label: "Members" },
  { href: "/agenda", label: "Agenda" },
  { href: "/blog", label: "Blog" },
  { href: "/communities", label: "Communities" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const publicNavItems = [{ href: "/members", label: "Members" }, { href: "/about", label: "About" }];

async function isAdmin(userId?: string) {
  if (!userId || !hasDatabase()) return false;
  const db = getDb();
  const [admin] = await db.select({ id: admins.id }).from(admins).where(eq(admins.userId, userId)).limit(1);
  return Boolean(admin);
}

export async function Navbar() {
  const session = await getServerSession(authOptions);
  const approvedMember = await getApprovedCurrentMember();
  const admin = await isAdmin(session?.user?.id);
  const navItems = approvedMember
    ? [...privateNavItems, ...(admin ? [{ href: "/admin", label: "Admin" }] : [])]
    : [...publicNavItems, ...(admin ? [{ href: "/admin", label: "Admin" }] : [])];

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-transparent px-4 pt-4 sm:px-6 lg:px-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link
          href="/"
          className="group flex items-center gap-3 rounded-full border border-white/55 bg-white/58 py-2 pl-2 pr-4 shadow-[0_18px_60px_rgba(16,54,92,0.12)] ring-1 ring-charcoal/5 backdrop-blur-2xl transition hover:bg-white/76"
          aria-label="IN-IT Member Hub home"
        >
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white shadow-md shadow-deep-blue/12 ring-1 ring-charcoal/10">
            <Image
              src="/in-it-logo.png"
              alt="IN-IT logo"
              width={44}
              height={44}
              priority
              className="h-full w-full object-cover"
            />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-black tracking-tight text-charcoal">IN-IT</span>
            <span className="hidden text-xs text-charcoal/55 xl:block">Iraqi Network of Information Technology</span>
          </span>
        </Link>
        <div className="hidden items-center gap-1 rounded-full border border-white/55 bg-white/48 p-1.5 shadow-[0_18px_60px_rgba(16,54,92,0.12)] ring-1 ring-charcoal/5 backdrop-blur-2xl lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-charcoal/72 transition hover:bg-white/72 hover:text-charcoal"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/55 bg-white/48 p-1.5 shadow-[0_18px_60px_rgba(16,54,92,0.12)] ring-1 ring-charcoal/5 backdrop-blur-2xl lg:flex">
          <Button asChild variant="ghost" size="sm" className="bg-white/40 hover:bg-white/72">
            <Link href={approvedMember ? "/profile" : "/inloggen"}>
              {approvedMember ? <Link2 className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
              {approvedMember ? "Profile" : "Sign in"}
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={approvedMember ? "/vandaag" : "/request-access"}>
              <Sparkles className="h-4 w-4" />
              {approvedMember ? "Explore" : "Request to join"}
            </Link>
          </Button>
        </div>
        <MobileNav
          items={navItems}
          secondary={approvedMember ? { href: "/profile", label: "Profile" } : { href: "/inloggen", label: "Sign in" }}
          primary={approvedMember ? { href: "/vandaag", label: "Explore" } : { href: "/request-access", label: "Request to join" }}
        />
      </nav>
    </header>
  );
}
