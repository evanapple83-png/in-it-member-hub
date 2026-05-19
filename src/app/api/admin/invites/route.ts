import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { invites } from "@/db/schema";
import { generateInviteCode, hashInviteCode } from "@/lib/invites";
import { requireAdminFromRequest } from "@/lib/admin-auth";

const createInviteSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  note: z.string().max(500).optional(),
});

export async function GET() {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const rows = await admin.db.select().from(invites).orderBy(desc(invites.createdAt));
  return NextResponse.json({
    invites: rows.map((invite) => ({
      id: invite.id,
      email: invite.email,
      note: invite.note,
      status: invite.status,
      expires_at: invite.expiresAt.toISOString(),
      used_at: invite.usedAt?.toISOString() ?? null,
      created_at: invite.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const payload = createInviteSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ error: "Invite email or note is invalid." }, { status: 400 });

  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [invite] = await admin.db
    .insert(invites)
    .values({
      codeHash: hashInviteCode(code),
      email: payload.data.email || null,
      note: payload.data.note || null,
      expiresAt,
    })
    .returning();

  return NextResponse.json({
    invite: {
      id: invite.id,
      code,
      email: invite.email,
      note: invite.note,
      status: invite.status,
      expires_at: invite.expiresAt.toISOString(),
    },
  });
}

export async function PATCH(request: Request) {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const payload = z.object({ id: z.string().uuid(), status: z.literal("revoked") }).safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ error: "Invite update is invalid." }, { status: 400 });

  const [invite] = await admin.db
    .update(invites)
    .set({ status: payload.data.status, updatedAt: new Date() })
    .where(eq(invites.id, payload.data.id))
    .returning();

  return NextResponse.json({ invite });
}
