import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { memberCvs } from "@/db/schema";
import { getAccessState } from "@/lib/access-state";
import { cvDetails, deleteMemberCv, getMemberCv } from "@/lib/member-cvs";
import { deleteStoredCv, hasCvStorage, storeCv } from "@/lib/cv-storage";
import { CvUploadError, readCvUpload } from "@/lib/cv-validation";
import { tooManyRequests, underLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

async function owner() {
  const access = await getAccessState();
  if (!access.userId) return { error: NextResponse.json({ error: "Log eerst in." }, { status: 401 }) };
  if (!access.member || ["rejected", "hidden", "deactivated"].includes(access.member.visibilityStatus)
    || !["approved", "pending", "incomplete"].includes(access.state)) {
    return { error: NextResponse.json({ error: "Je kunt op dit moment geen cv beheren." }, { status: 403 }) };
  }
  return { member: access.member, userId: access.userId };
}

function wrongOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin && origin !== new URL(request.url).origin;
}

export async function GET() {
  const access = await owner();
  if (access.error) return access.error;
  const cv = await getMemberCv(access.member.id);
  return NextResponse.json({ cv: cv ? cvDetails(cv) : null }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const access = await owner();
  if (access.error) return access.error;
  if (wrongOrigin(request)) return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 403 });
  if (!(await underLimit(`cv-upload:${access.userId}`, 10, 3600))) return tooManyRequests();
  if (!hasCvStorage()) return NextResponse.json({ error: "Cv uploaden is tijdelijk niet beschikbaar." }, { status: 503 });
  try {
    const upload = await readCvUpload(request);
    const previous = await getMemberCv(access.member.id);
    const stored = await storeCv(access.member.id, upload.content);
    const values = { ...stored, filename: upload.filename, size: upload.size, uploadedAt: new Date() };
    let saved;
    try {
      // Compare-and-swap prevents concurrent replacements from orphaning files.
      [saved] = previous
        ? await getDb().update(memberCvs).set(values)
          .where(and(eq(memberCvs.memberId, access.member.id), eq(memberCvs.storageKey, previous.storageKey))).returning()
        : await getDb().insert(memberCvs).values({ memberId: access.member.id, ...values }).onConflictDoNothing().returning();
    } catch (error) {
      await deleteStoredCv(stored).catch(console.error);
      throw error;
    }
    if (!saved) {
      await deleteStoredCv(stored);
      return NextResponse.json({ error: "Je cv is ondertussen gewijzigd. Probeer opnieuw." }, { status: 409 });
    }
    if (previous) await deleteStoredCv(previous).catch((error) => console.error("[cv] replacement cleanup failed", error));
    return NextResponse.json({ cv: cvDetails(saved) }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof CvUploadError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[cv] upload failed", error);
    return NextResponse.json({ error: "Cv uploaden lukte niet. Probeer het opnieuw." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const access = await owner();
  if (access.error) return access.error;
  if (wrongOrigin(request)) return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 403 });
  try {
    await deleteMemberCv(access.member.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[cv] deletion failed", error);
    return NextResponse.json({ error: "Verwijderen lukte niet. Probeer het opnieuw." }, { status: 503 });
  }
}
