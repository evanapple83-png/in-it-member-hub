import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { adminCan } from "@/lib/roles";
import { sniffImage } from "@/lib/validation";

const MAX_BYTES = 5 * 1024 * 1024;

// Cover image for a group (same Blob pattern as /api/upload/profile-photo). Returns the public URL;
// the caller stores it on the community via PATCH/POST `cover_image_url`.
export async function POST(request: Request) {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  if (!adminCan(admin.role, "manage_communities")) {
    return NextResponse.json({ error: "Alleen de beheerder mag groepen beheren." }, { status: 403 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Foto uploaden lukt op dit moment niet. Probeer het later opnieuw." }, { status: 503 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Kies eerst een foto." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "De foto is groter dan 5 MB." }, { status: 400 });
  const sniffed = await sniffImage(file);
  if (!sniffed) {
    return NextResponse.json({ error: "Alleen PNG, JPG en WebP worden ondersteund." }, { status: 400 });
  }

  const path = `community-covers/${Date.now()}-${randomUUID().slice(0, 8)}.${sniffed.ext}`;
  const blob = await put(path, file, { access: "public", contentType: sniffed.type });
  return NextResponse.json({ url: blob.url });
}
