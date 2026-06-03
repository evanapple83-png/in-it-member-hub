import { NextResponse } from "next/server";
import { z } from "zod";
import { approveAccessRequest, listAccessRequests, rejectAccessRequest } from "@/lib/access-requests";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { adminCan } from "@/lib/roles";

export async function GET() {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const requests = await listAccessRequests();
  return NextResponse.json({ requests });
}

const reviewSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  note: z.string().max(500).optional(),
});

export async function PATCH(request: Request) {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  if (!adminCan(admin.role, "review_access")) {
    return NextResponse.json({ error: "Alleen de coordinator mag toegangsaanvragen beoordelen." }, { status: 403 });
  }

  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid review payload." }, { status: 400 });

  const result =
    parsed.data.action === "approve"
      ? await approveAccessRequest(parsed.data.id, admin.adminId)
      : await rejectAccessRequest(parsed.data.id, admin.adminId, parsed.data.note);

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
