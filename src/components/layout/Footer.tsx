import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { isApprovedMember } from "@/lib/access";

export async function Footer() {
  const approvedMember = await isApprovedMember();
  const hubLinks = approvedMember
    ? [
        { href: "/members", label: "Leden" },
        { href: "/communities", label: "Groepen" },
        { href: "/profile", label: "Profiel" },
        { href: "/contact", label: "Contact" },
      ]
    : [
        { href: "/members", label: "Ontdek de leden" },
        { href: "/request-access", label: "Toegang aanvragen" },
        { href: "/about", label: "Over IN-IT" },
        { href: "/join", label: "Uitnodigingscode gebruiken" },
      ];

  return (
    <footer className="border-t border-charcoal/10 bg-[#f7efe3]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-date text-sm font-black text-white">IN</span>
            <div>
              <p className="font-black text-charcoal">IN-IT Ledenomgeving</p>
              <p className="text-sm text-charcoal/60">Iraqi Network of Information Technology</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-charcoal/65">
            Wij verbinden Iraakse IT-professionals in Nederland door kennis te delen, kansen te ontdekken en elkaar te ondersteunen.
          </p>
        </div>
        <div>
          <p className="font-semibold text-charcoal">Ontdek IN-IT</p>
          <div className="mt-3 grid gap-2 text-sm text-charcoal/65">
            {hubLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold text-charcoal">Vertrouwen</p>
          <div className="mt-3 grid gap-3 text-sm text-charcoal/65">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-date" />
              Lidmaatschap met toestemming en goedkeuring
            </span>
            <Link href={approvedMember ? "/contact" : "/join"} className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-date" />
              {approvedMember ? "Neem contact op met het team" : "Toegang met een uitnodiging"}
            </Link>
            <Link href="/privacy">Privacyverklaring</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
