import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/db";
import { getActiveInviteByCode, normalizeInviteCode } from "@/lib/invites";
import { clientIp, tooManyRequests, underLimit } from "@/lib/rate-limit";
import { readJson } from "@/lib/validation";

const inviteSchema = z.object({
  code: z.string().min(8).max(40),
});

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Uitnodigingen controleren lukt nu niet. Probeer het later opnieuw." }, { status: 503 });
  }

  // Codes are short, so guessing is capped per IP: 10 tries per 10 minutes, 30 per day.
  const ip = clientIp(request);
  if (!(await underLimit(`invite:10m:${ip}`, 10, 600)) || !(await underLimit(`invite:1d:${ip}`, 30, 86400))) {
    return tooManyRequests();
  }

  const payload = inviteSchema.safeParse(await readJson(request));
  if (!payload.success) {
    return NextResponse.json({ error: "Vul een geldige uitnodigingscode in." }, { status: 400 });
  }

  const code = normalizeInviteCode(payload.data.code);
  const invite = await getActiveInviteByCode(code);
  if (!invite) {
    return NextResponse.json({ error: "Deze code is ongeldig, verlopen of al gebruikt." }, { status: 404 });
  }

  const response = NextResponse.json({
    ok: true,
    email_locked: Boolean(invite.email),
    expires_at: invite.expiresAt.toISOString(),
  });

  response.cookies.set("in_it_invite_code", code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: invite.expiresAt,
  });

  return response;
}
