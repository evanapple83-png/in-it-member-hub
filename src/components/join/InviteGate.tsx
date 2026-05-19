"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinkedInButton } from "@/components/join/LinkedInButton";

export function InviteGate({ initialCode = "" }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode);
  const [status, setStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function validateInvite(nextCode = code) {
    setStatus("checking");
    setMessage(null);
    const response = await fetch("/api/invites/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: nextCode }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus("invalid");
      setMessage(body.error ?? "This invite code is invalid or expired.");
      return;
    }
    setStatus("valid");
    setMessage("Invite accepted. You can continue with LinkedIn.");
  }

  useEffect(() => {
    if (!initialCode) return;
    const timer = window.setTimeout(() => {
      void validateInvite(initialCode);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  return (
    <div className="rounded-[2rem] border border-charcoal/10 bg-white/80 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-deep-blue text-white">
          <KeyRound className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-black text-charcoal">Invite-only access</h2>
          <p className="mt-2 text-sm leading-6 text-charcoal/62">
            Enter the 24-hour code you received from an IN-IT admin. LinkedIn sign-in unlocks only after the invite is validated.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setStatus("idle");
            setMessage(null);
          }}
          placeholder="INIT-XXXXXXXX"
          aria-label="Invite code"
          className="h-12 rounded-2xl uppercase"
        />
        <Button type="button" variant="outline" disabled={status === "checking" || code.length < 8} onClick={() => validateInvite()}>
          {status === "checking" ? "Checking..." : "Validate code"}
        </Button>
      </div>

      {message ? (
        <p className={`mt-3 flex items-center gap-2 text-sm font-semibold ${status === "valid" ? "text-deep-blue" : "text-date"}`}>
          {status === "valid" ? <CheckCircle2 className="h-4 w-4" /> : null}
          {message}
        </p>
      ) : null}

      <div className="mt-6">
        <LinkedInButton disabled={status !== "valid"} />
      </div>
    </div>
  );
}
