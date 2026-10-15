import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function JoinCta() {
  return (
    <section className="px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-deep-blue p-8 text-white sm:p-12 lg:p-16">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full border-[50px] border-white/5" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Your community is waiting</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Find your people in tech.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75">Bring your experience, your questions, and your ambition. Let’s build new connections together.</p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-4 lg:items-center">
            <Button asChild variant="secondary" size="lg"><Link href="/request-access">Request to join <ArrowRight className="h-4 w-4" /></Link></Button>
            <Link href="/join" className="text-sm font-medium text-white/80 underline underline-offset-4 hover:text-white">Already have an invite?</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
