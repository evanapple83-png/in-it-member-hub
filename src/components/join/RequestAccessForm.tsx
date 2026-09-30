"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

type RequesterType = "member" | "friend";

export function RequestAccessForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requesterType, setRequesterType] = useState<RequesterType>("member");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [motivation, setMotivation] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  // Honeypot: invisible to people, bots fill every field and get rejected by the API.
  const [website, setWebsite] = useState("");

  async function submit() {
    setStatus("sending");
    setError(null);
    const response = await fetch("/api/access-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email,
        phone,
        requester_type: requesterType,
        linkedin_url: linkedinUrl,
        motivation,
        ...(website ? { website } : {}),
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus("idle");
      setError(body.error ?? "Er ging iets mis. Probeer het later opnieuw.");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-[2rem] border border-deep-blue/20 bg-white/85 p-8 shadow-sm">
        <CheckCircle2 className="h-10 w-10 text-deep-blue" />
        <h2 className="mt-4 text-2xl font-black text-charcoal">Aanvraag ontvangen</h2>
        <p className="mt-3 max-w-xl leading-7 text-charcoal/66">
          Bedankt, {fullName.split(" ")[0] || "bedankt"}. De coordinator beoordeelt je aanvraag. Na goedkeuring ontvang je
          per e-mail een eenmalige activeringscode waarmee je via LinkedIn kunt inloggen.
        </p>
      </div>
    );
  }

  const canSubmit = fullName.trim().length >= 2 && /.+@.+\..+/.test(email) && status !== "sending";

  return (
    <div className="rounded-[2rem] border border-charcoal/10 bg-white/82 p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-black text-charcoal">Vraag toegang aan</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/62">
        Toegang tot IN-IT verloopt op uitnodiging. Vul je gegevens in; de coordinator beoordeelt elke aanvraag en stuurt
        bij goedkeuring een eenmalige activeringscode. Inloggen kan uitsluitend via LinkedIn.
      </p>

      <div className="mt-6 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold text-charcoal/80">
            Volledige naam *
            <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Voornaam Achternaam" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-charcoal/80">
            E-mailadres *
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jij@voorbeeld.nl" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold text-charcoal/80">
            Telefoonnummer
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+31 6 ..." />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-charcoal/80">
            Ik ben
            <select
              value={requesterType}
              onChange={(event) => setRequesterType(event.target.value as RequesterType)}
              className="h-11 w-full rounded-2xl border border-charcoal/12 bg-white/80 px-4 text-sm text-charcoal shadow-sm outline-none transition focus:border-deep-blue/40 focus:ring-4 focus:ring-dutch-blue/20"
            >
              <option value="member">Lid van IN-IT</option>
              <option value="friend">Vriend van IN-IT</option>
            </select>
          </label>
        </div>

        <label className="grid gap-1.5 text-sm font-semibold text-charcoal/80">
          LinkedIn-profiel (optioneel)
          <Input value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} placeholder="https://www.linkedin.com/in/..." />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-charcoal/80">
          Motivatie / toelichting
          <Textarea
            value={motivation}
            onChange={(event) => setMotivation(event.target.value)}
            placeholder="Vertel kort over je band met IN-IT en waarom je toegang wilt."
          />
        </label>

        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          style={{ position: "absolute", left: "-10000px", width: 1, height: 1, opacity: 0 }}
        />
        {error ? <p className="text-sm font-semibold text-date">{error}</p> : null}

        <div className="flex items-center gap-3">
          <Button type="button" onClick={submit} disabled={!canSubmit}>
            <Send className="h-4 w-4" />
            {status === "sending" ? "Versturen..." : "Aanvraag versturen"}
          </Button>
          <p className="text-xs leading-5 text-charcoal/50">
            Je gegevens worden alleen gebruikt om je aanvraag te beoordelen (AVG).
          </p>
        </div>
      </div>
    </div>
  );
}
