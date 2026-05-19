"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CulturalPattern } from "@/components/ui/CulturalPattern";
import { MemberCard } from "@/components/members/MemberCard";
import type { Member } from "@/lib/types";

export function HeroSection({ members, isMember = false }: { members: Member[]; isMember?: boolean }) {
  const showMemberCards = isMember && members.length >= 4;

  return (
    <section className="relative isolate overflow-hidden px-4 pb-16 pt-36 sm:px-6 sm:pt-40 lg:px-8 lg:pt-44">
      <Image
        src="/in-it-hero-background.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-30 h-full w-full object-cover object-center opacity-100 saturate-110 contrast-105"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(251,248,242,0.64)_0%,rgba(251,248,242,0.68)_34%,rgba(251,248,242,0.40)_64%,rgba(251,248,242,0.58)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-44 bg-gradient-to-b from-transparent via-off-white/70 to-off-white"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_35%_27%,rgba(255,255,255,0.72),transparent_34%),radial-gradient(ellipse_at_56%_20%,rgba(255,255,255,0.56),transparent_30%)]"
      />
      <Image
        src="/in-it-winged-icon.png"
        alt=""
        width={190}
        height={190}
        className="pointer-events-none absolute bottom-10 right-[8%] -z-10 hidden opacity-[0.34] mix-blend-multiply lg:block"
      />
      <CulturalPattern className="-z-10 opacity-[0.035]" />
      <div className="relative z-20 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <h1 className="max-w-4xl text-5xl font-black tracking-tight text-charcoal sm:text-6xl lg:text-7xl">
            Meet the Iraqi tech community shaping digital innovation in the Netherlands.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-charcoal/70 sm:text-xl">
            IN-IT verbindt IT-professionals met Iraakse roots die actief zijn in Nederland. Ontdek expertise, vind mentoren, bouw
            connecties en versterk samen de community.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={isMember ? "/members" : "/join"}>
                {isMember ? "Explore members" : "Enter with invite"}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href={isMember ? "/communities" : "/about"}>{isMember ? "View communities" : "About IN-IT"}</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {["Azure", "Cybersecurity", "Product Strategy", "AI", "Mentoring"].map((skill, index) => (
              <motion.span
                key={skill}
                className="rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-bold text-charcoal shadow-sm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + index * 0.05 }}
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </motion.div>
        <div className="relative min-h-[520px]">
          {showMemberCards ? (
            <>
              <motion.div
                className="absolute left-0 top-4 w-[88%] max-w-md"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <MemberCard member={members[0]} compact />
              </motion.div>
              <motion.div
                className="absolute right-0 top-48 w-[86%] max-w-md"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              >
                <MemberCard member={members[3]} compact />
              </motion.div>
            </>
          ) : (
            <motion.div
              className="absolute left-0 top-8 w-[92%] max-w-lg rounded-[2rem] border border-white/60 bg-white/68 p-7 shadow-[0_28px_90px_rgba(16,54,92,0.16)] backdrop-blur-xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="text-sm font-black uppercase tracking-[0.18em] text-date">Private member hub</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-charcoal">Profiles, communities and expertise stay behind verified access.</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {["Invite code", "LinkedIn sign-in", "Admin approval"].map((item) => (
                  <span key={item} className="rounded-2xl border border-charcoal/10 bg-white/70 px-3 py-3 text-center text-xs font-black text-charcoal/72">
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
          <motion.div
            className="absolute bottom-2 left-10 w-[82%] max-w-sm rounded-3xl border border-charcoal/10 bg-charcoal p-5 text-white shadow-2xl"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold text-charcoal">
                <Search className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Find the right member</p>
                <p className="text-xs text-white/62">“Who can mentor a junior developer?”</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
