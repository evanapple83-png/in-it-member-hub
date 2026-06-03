import Link from "next/link";
import { ClipboardCheck, Mail, ShieldCheck } from "lucide-react";
import { RequestAccessForm } from "@/components/join/RequestAccessForm";
import { PageShell } from "@/components/layout/PageShell";

export const metadata = {
  title: "Toegang aanvragen — IN-IT Community",
  description: "Vraag digitaal toegang aan tot de besloten IN-IT community.",
};

const steps = [
  { icon: ClipboardCheck, title: "1. Aanvraag", text: "Je vult dit formulier in. De coordinator beoordeelt en registreert elke aanvraag." },
  { icon: Mail, title: "2. Activeringscode", text: "Na goedkeuring ontvang je per e-mail een eenmalige code (24 uur geldig)." },
  { icon: ShieldCheck, title: "3. LinkedIn-login", text: "Met de code activeer je je toegang en log je in via LinkedIn." },
];

export default function RequestAccessPage() {
  return (
    <PageShell
      eyebrow="Besloten community"
      title="Vraag toegang aan tot IN-IT"
      description="IN-IT is een besloten omgeving voor leden en vrienden van de community. Toegang verloopt via goedkeuring door de coordinator."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <RequestAccessForm />
        <div className="grid gap-4">
          {steps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-3xl border border-charcoal/10 bg-white/72 p-5 shadow-sm">
              <Icon className="h-6 w-6 text-date" />
              <h3 className="mt-3 font-black text-charcoal">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-charcoal/64">{text}</p>
            </div>
          ))}
          <div className="rounded-3xl bg-sand/35 p-5 text-sm leading-6 text-charcoal/66">
            Heb je al een activeringscode?{" "}
            <Link href="/join" className="font-bold text-deep-blue underline-offset-2 hover:underline">
              Ga naar inloggen
            </Link>
            .
          </div>
        </div>
      </div>
    </PageShell>
  );
}
