import { redirect } from "next/navigation";

export default async function LegacyPublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/profile/${encodeURIComponent(id)}`);
}
