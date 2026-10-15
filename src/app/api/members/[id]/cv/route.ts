import { NextResponse } from "next/server";
import { getAccessState } from "@/lib/access-state";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { adminCan } from "@/lib/roles";
import { getMemberCv } from "@/lib/member-cvs";
import { readStoredCv } from "@/lib/cv-storage";
import { safeCvFilename } from "@/lib/cv-validation";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getAccessState();
  if (!access.userId) return NextResponse.json({ error: "Log eerst in." }, { status: 401 });
  const { id } = await params;
  if (access.member?.id !== id || ["rejected", "hidden", "deactivated"].includes(access.member.visibilityStatus)
    || !["approved", "pending", "incomplete"].includes(access.state)) {
    const admin = await requireAdminFromRequest();
    if (!admin.ok || !adminCan(admin.role, "manage_users")) {
      return NextResponse.json({ error: "Geen toegang tot dit cv." }, { status: 403 });
    }
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Cv niet gevonden." }, { status: 404 });
  }
  const cv = await getMemberCv(id);
  if (!cv) return NextResponse.json({ error: "Cv niet gevonden." }, { status: 404 });
  try {
    return new Response(await readStoredCv(cv), { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeCvFilename(cv.filename)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
    } });
  } catch (error) {
    console.error("[cv] download failed", error);
    return NextResponse.json({ error: "Cv downloaden is tijdelijk niet beschikbaar." }, { status: 503 });
  }
}
