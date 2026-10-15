import { notFound } from "next/navigation";
import { PublicMemberProfile } from "@/components/members/PublicMemberProfile";
import { getPublicProfile } from "@/lib/members";

export const metadata = { title: "Publiek profiel | IN-IT" };

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getPublicProfile(id);
  if (!member) notFound();
  return <PublicMemberProfile member={member} />;
}
