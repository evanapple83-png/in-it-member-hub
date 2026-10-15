import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Lightbulb, UsersRound } from "lucide-react";

const benefits = [
  { icon: UsersRound, title: "Vind expertise. Deel jouw kennis.", text: "Ontmoet vakgenoten in software, data, cloud en beveiliging. Vind iemand om van te leren, ideeën mee uit te wisselen of te helpen bij een volgende stap." },
  { icon: Lightbulb, title: "Blijf samen leren.", text: "Praat mee in de groepen. Stel een vraag, deel wat je tijdens een project hebt geleerd en ontdek nieuwe perspectieven." },
  { icon: CalendarDays, title: "Van een connectie naar een goed gesprek.", text: "Doe mee aan bijeenkomsten en kennissessies. Geef namen een gezicht en leer de mensen achter de functietitels kennen." },
];

export function CommunityBenefits() {
  return (
    <section aria-labelledby="benefits-title" className="border-y border-charcoal/5 bg-sand/20 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-date">Meer dan een ledenoverzicht</p>
        <h2 id="benefits-title" className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">Een gedeelde achtergrond.<br />Samen kom je verder.</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3 lg:gap-12">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-date/10 bg-date/5 text-date"><Icon className="h-6 w-6" /></span>
              <h3 className="text-xl font-bold tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-charcoal/65">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { title: "Vertel iets over jezelf", text: "Vraag toegang aan en stel jezelf voor. Onze coördinator beoordeelt je aanvraag." },
  { title: "Ontvang je uitnodiging", text: "Na goedkeuring ontvang je een persoonlijke uitnodigingscode. Deze is eenmalig te gebruiken en 24 uur geldig." },
  { title: "Voel je thuis", text: "Gebruik je code, log in met LinkedIn en vul je profiel aan. Na goedkeuring van je profiel krijg je toegang tot de ledenomgeving." },
];

export function HowToJoin() {
  return (
    <section aria-labelledby="joining-title" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-date">Zo sluit je aan</p>
            <h2 id="joining-title" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Het begint met een kennismaking.</h2>
          </div>
          <Link href="/request-access" className="inline-flex items-center gap-2 text-sm font-bold text-deep-blue hover:underline">Zet de eerste stap <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <ol className="mt-10 grid gap-8 md:grid-cols-3 lg:gap-12">
          {steps.map(({ title, text }, index) => (
            <li key={title} className="border-t border-charcoal/15 pt-6">
              <span aria-hidden="true" className="text-sm font-bold tracking-widest text-date">0{index + 1}</span>
              <h3 className="mt-4 text-xl font-bold tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-charcoal/65">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function CommunityStory() {
  return (
    <section aria-labelledby="story-title" className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2.5rem] border border-charcoal/10 bg-warm-cream/50 md:grid-cols-[0.8fr_1.2fr]">
        <div className="relative flex min-h-56 items-center justify-center overflow-hidden bg-sand/45 p-10 md:min-h-80">
          <Image src="/in-it-winged-icon.png" alt="" width={260} height={260} className="relative z-10 w-44 mix-blend-multiply md:w-60" />
          <div aria-hidden="true" className="absolute h-72 w-72 rounded-full border border-date/10" />
          <div aria-hidden="true" className="absolute h-96 w-96 rounded-full border border-date/10" />
        </div>
        <div className="p-7 sm:p-10 lg:p-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-date">Ons verhaal</p>
          <h2 id="story-title" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Geworteld in Irak.<br />Verbonden in Nederland.</h2>
          <p className="mt-5 leading-7 text-charcoal/70">IN-IT staat voor Iraqi Network of Information Technology. We brengen IT-professionals met Iraakse roots samen die in Nederland wonen en werken.</p>
          <p className="mt-4 leading-7 text-charcoal/70">Ons doel is eenvoudig: elkaar makkelijker vinden, kennis uitwisselen en anderen op weg helpen. Of je nu net begint of jaren ervaring meebrengt, jouw perspectief is welkom.</p>
          <Link href="/about" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-deep-blue hover:underline">Meer over IN-IT <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
}
