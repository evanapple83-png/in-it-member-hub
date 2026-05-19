import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { members } from "@/db/schema";
import { memberFromRow } from "@/db/mapper";
import { requireAdminFromRequest } from "@/lib/admin-auth";

export async function GET() {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const rows = await admin.db.select().from(members).orderBy(desc(members.createdAt));
  return NextResponse.json({ members: rows.map(memberFromRow) });
}
