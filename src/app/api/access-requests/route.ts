import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/db";
import { createAccessRequest } from "@/lib/access-requests";
import { clientIp, tooManyRequests, underLimit } from "@/lib/rate-limit";
import { linkedinUrl } from "@/lib/validation";

// Public endpoint (FR-004): a prospective member or friend digitally registers an access request.
// Approval and activation are handled later by the coordinator (FR-005/006).
const requestSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().trim().max(254).email(),
  phone: z.string().max(40).optional().or(z.literal("")),
  requester_type: z.enum(["member", "friend"]).default("member"),
  motivation: z.string().max(1000).optional().or(z.literal("")),
  linkedin_url: linkedinUrl.optional().or(z.literal("")),
  // Honeypot: hidden in the form, only bots fill it.
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "Toegangsaanvragen vereisen een geconfigureerde database. Neem telefonisch contact op met de coordinator." },
      { status: 503 },
    );
  }

  const ip = clientIp(request);
  if (!(await underLimit(`access:1h:${ip}`, 5, 3600))) return tooManyRequests();

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Controleer de ingevulde velden en probeer opnieuw." }, { status: 400 });
  }

  const data = parsed.data;
  const created = await createAccessRequest({
    fullName: data.full_name,
    email: data.email,
    phone: data.phone || null,
    requesterType: data.requester_type,
    motivation: data.motivation || null,
    linkedinUrl: data.linkedin_url || null,
  });

  return NextResponse.json({ ok: true, id: created.id });
}
