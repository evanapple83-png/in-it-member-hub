import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log eerst in om een profielfoto te uploaden." }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Foto uploaden lukt op dit moment niet. Probeer het later opnieuw." }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Kies eerst een foto." }, { status: 400 });
  }

  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "Alleen PNG, JPG en WebP worden ondersteund." }, { status: 400 });
  }

  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const blob = await put(`profile-photos/${session.user.id}/${Date.now()}-${safeName}`, file, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
}
