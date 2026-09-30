import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, hasDatabase } from "@/db";
import { linkedinAccounts } from "@/db/schema";
import { getAccessState } from "@/lib/access-state";
import { sniffImage } from "@/lib/validation";
import { tooManyRequests, underLimit } from "@/lib/rate-limit";

const MAX_BYTES = 5 * 1024 * 1024;

// Onboarding uploads before the members row exists, so no-member/incomplete/pending are allowed.
// Only a signed-in hub user (a linkedin_accounts row from an invite or bootstrap sign-in) may upload.
const BLOCKED_STATES = new Set(["anon", "rejected", "deactivated"]);

export async function POST(request: Request) {
  const access = await getAccessState();
  if (!access.userId || access.state === "anon") {
    return NextResponse.json({ error: "Log eerst in om een profielfoto te uploaden." }, { status: 401 });
  }
  if (BLOCKED_STATES.has(access.state)) {
    return NextResponse.json({ error: "Je kunt op dit moment geen profielfoto uploaden." }, { status: 403 });
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Foto uploaden lukt op dit moment niet. Probeer het later opnieuw." }, { status: 503 });
  }

  const [account] = await getDb()
    .select({ id: linkedinAccounts.id })
    .from(linkedinAccounts)
    .where(eq(linkedinAccounts.userId, access.userId))
    .limit(1);
  if (!account) {
    return NextResponse.json({ error: "Je kunt op dit moment geen profielfoto uploaden." }, { status: 403 });
  }

  if (!(await underLimit(`upload:${access.userId}`, 10, 3600))) return tooManyRequests();

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Foto uploaden lukt op dit moment niet. Probeer het later opnieuw." }, { status: 503 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Kies eerst een foto." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "De foto is groter dan 5 MB." }, { status: 400 });
  }

  const sniffed = await sniffImage(file);
  if (!sniffed) {
    return NextResponse.json({ error: "Alleen PNG, JPG en WebP worden ondersteund." }, { status: 400 });
  }

  const path = `profile-photos/${access.userId}/${Date.now()}-${randomUUID().slice(0, 8)}.${sniffed.ext}`;
  const blob = await put(path, file, { access: "public", contentType: sniffed.type });

  return NextResponse.json({ url: blob.url });
}
