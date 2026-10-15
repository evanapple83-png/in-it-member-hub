import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Code2, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CulturalPattern } from "@/components/ui/CulturalPattern";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden px-4 pb-16 pt-36 sm:px-6 sm:pt-40 lg:px-8 lg:pb-24 lg:pt-48">
      <Image src="/in-it-hero-background.png" alt="" fill priority sizes="100vw"
        className="absolute inset-0 -z-30 object-cover opacity-25" />
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-gradient-to-r from-off-white via-off-white/85 to-off-white/40" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-off-white to-transparent" />
      <CulturalPattern className="-z-10 opacity-[0.025]" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
        <div>
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-date sm:text-sm">
            <span className="h-px w-8 bg-date/50" aria-hidden="true" /> Iraakse roots. Gedeelde ambities.
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-charcoal sm:text-6xl lg:text-[4.5rem]">
            Wij verbinden Iraakse <span className="text-deep-blue">IT-professionals</span> in Nederland.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-charcoal/70">
            Ontmoet mensen die je achtergrond begrijpen, deel je kennis en vergroot je netwerk.
            Van je eerste IT-baan tot je volgende grote idee: hier is plek voor jou.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link href="/request-access">Toegang aanvragen <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/members">Ontdek de leden</Link></Button>
          </div>
          <p className="mt-5 text-sm text-charcoal/60">Heb je al een uitnodiging? <Link href="/join" className="font-semibold text-deep-blue underline underline-offset-4">Gebruik je code</Link></p>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-gold/25 bg-white/65 px-7 pb-7 pt-9 shadow-[0_30px_90px_-35px_rgba(16,54,92,0.3)] sm:px-9">
            <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal/55">
              <span>Irak</span><span className="h-px flex-1 bg-gold/40" aria-hidden="true" /><span>Nederland</span>
            </div>
            <div className="relative mx-auto my-7 aspect-square max-w-64 rounded-full bg-sand/30 ring-1 ring-gold/20">
              <Image src="/in-it-winged-icon.png" alt="" fill sizes="256px" className="object-contain p-5 mix-blend-multiply" />
            </div>
            <p className="text-center text-2xl font-black tracking-tight text-deep-blue">Gedeelde roots.<br />Nieuwe mogelijkheden.</p>
            <p className="mt-3 text-center text-sm leading-6 text-charcoal/65">Verschillende verhalen. Dezelfde passie voor technologie.<br />Een netwerk om samen verder te komen.</p>
            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-charcoal/10 pt-5 text-sm font-semibold text-charcoal/70">
              <span className="flex items-center gap-2"><Code2 className="h-4 w-4 text-date" />IT verbindt ons</span>
              <span className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-date" />Roots brengen ons samen</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-14 flex max-w-7xl flex-col justify-between gap-5 border-t border-charcoal/10 pt-6 sm:flex-row sm:items-center">
        <p className="text-sm text-charcoal/60">Software · Data & AI · Cloud · Beveiliging · En meer</p>
        <Link href="#community" className="inline-flex items-center gap-2 text-sm font-semibold text-deep-blue">Maak kennis met de community <ArrowDown className="h-4 w-4" /></Link>
      </div>
    </section>
  );
}
