import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { isApprovedMember } from "@/lib/access";

export async function Footer() {
  const approvedMember = await isApprovedMember();
  const hubLinks = approvedMember
    ? [
        { href: "/members", label: "Members" },
        { href: "/communities", label: "Communities" },
        { href: "/profile", label: "Profile" },
        { href: "/contact", label: "Contact" },
      ]
    : [
        { href: "/members", label: "Explore members" },
        { href: "/request-access", label: "Request to join" },
        { href: "/about", label: "About" },
        { href: "/join", label: "Sign in with invite" },
      ];

  return (
    <footer className="border-t border-charcoal/10 bg-[#f7efe3]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-date text-sm font-black text-white">IN</span>
            <div>
              <p className="font-black text-charcoal">IN-IT Member Hub</p>
              <p className="text-sm text-charcoal/60">Iraqi Network of Information Technology</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-charcoal/65">
            Connecting Iraqi tech professionals in the Netherlands through shared expertise, new opportunities and a sense of belonging.
          </p>
        </div>
        <div>
          <p className="font-semibold text-charcoal">Hub</p>
          <div className="mt-3 grid gap-2 text-sm text-charcoal/65">
            {hubLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold text-charcoal">Trust</p>
          <div className="mt-3 grid gap-3 text-sm text-charcoal/65">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-date" />
              Consent and admin approval required
            </span>
            <Link href={approvedMember ? "/contact" : "/join"} className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-date" />
              {approvedMember ? "Contact the community team" : "Invite required to enter"}
            </Link>
            <Link href="/privacy">Privacy policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
