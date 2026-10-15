import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Lightbulb, UsersRound } from "lucide-react";

const benefits = [
  { icon: UsersRound, title: "Find expertise. Share yours.", text: "Meet peers across software, data, cloud and security. Find someone to learn from, exchange ideas with, or support as they take their next step." },
  { icon: Lightbulb, title: "Keep learning, together.", text: "Join conversations in community groups. Ask a question, share a lesson from a project, and discover a perspective you hadn’t considered." },
  { icon: CalendarDays, title: "Turn connections into conversations.", text: "Take part in community events and knowledge sessions. Put faces to names and get to know people beyond their job titles." },
];

export function CommunityBenefits() {
  return (
    <section aria-labelledby="benefits-title" className="border-y border-charcoal/5 bg-sand/20 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-date">More than a directory</p>
        <h2 id="benefits-title" className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">A shared background.<br />So many ways to move forward.</h2>
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
  { title: "Tell us a little about you", text: "Request to join and introduce yourself. Our coordinator reviews your request." },
  { title: "Receive your invitation", text: "Once your request is approved, you’ll receive a personal, one-time invitation code, valid for 24 hours." },
  { title: "Make yourself at home", text: "Use your code, sign in with LinkedIn and complete your profile. After profile approval, explore the member hub." },
];

export function HowToJoin() {
  return (
    <section aria-labelledby="joining-title" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-date">How to join</p>
            <h2 id="joining-title" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">It starts with an introduction.</h2>
          </div>
          <Link href="/request-access" className="inline-flex items-center gap-2 text-sm font-bold text-deep-blue hover:underline">Take the first step <ArrowRight className="h-4 w-4" /></Link>
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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-date">Our story</p>
          <h2 id="story-title" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Rooted in Iraq.<br />Connected in the Netherlands.</h2>
          <p className="mt-5 leading-7 text-charcoal/70">IN-IT stands for the Iraqi Network of Information Technology. We bring together IT professionals with Iraqi roots who are building their careers and lives in the Netherlands.</p>
          <p className="mt-4 leading-7 text-charcoal/70">Our purpose is simple: make it easier to find one another, exchange knowledge, and help the next person along. Whether you’re just starting out or bringing years of experience, your perspective belongs here.</p>
          <Link href="/about" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-deep-blue hover:underline">Get to know IN-IT <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
}
