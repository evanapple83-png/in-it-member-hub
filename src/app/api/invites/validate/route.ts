import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/db";
import { getActiveInviteByCode, normalizeInviteCode } from "@/lib/invites";

const inviteSchema = z.object({
  code: z.string().min(8),
});

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Neon DATABASE_URL is required for invite-only access." }, { status: 503 });
  }

  const payload = inviteSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Enter a valid invite code." }, { status: 400 });
  }

  const code = normalizeInviteCode(payload.data.code);
  const invite = await getActiveInviteByCode(code);
  if (!invite) {
    return NextResponse.json({ error: "This invite code is invalid, expired or already used." }, { status: 404 });
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
