import Link from "next/link";
import { Link2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

export function JoinCta() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-deep-blue via-date to-charcoal p-8 text-white shadow-2xl md:p-12">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-gold">
              <LockKeyhole className="h-4 w-4" />
              Review, consent, approval
            </p>
            <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-tight">Join a hub where visibility is earned with trust.</h2>
            <p className="mt-4 max-w-2xl text-white/68">
              Entry starts with a 24-hour invite code from an admin. LinkedIn is used only after that to sign in and prefill your own profile.
            </p>
          </div>
          <Button asChild variant="secondary" size="lg">
            <Link href="/join">
              <Link2 className="h-5 w-5" />
              Use invite code
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
