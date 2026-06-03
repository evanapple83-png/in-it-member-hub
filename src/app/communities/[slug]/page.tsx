import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { CommunityRoom } from "@/components/communities/CommunityRoom";
import { getApprovedCurrentMember } from "@/lib/access";
import { getCurrentAdminRole } from "@/lib/admin-auth";
import {
  getCommunityBySlug,
  getCommunityMembers,
  getMembership,
  listCommunityPosts,
} from "@/lib/communities";

export default async function CommunityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const member = await getApprovedCurrentMember();
  if (!member) redirect("/join?locked=communities");

  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const adminRole = await getCurrentAdminRole();
  const isAdmin = adminRole !== null;
  const [members, membership, posts] = await Promise.all([
    getCommunityMembers(community.id),
    getMembership(community.id, member.id),
    listCommunityPosts(community.id, isAdmin),
  ]);

  return (
    <PageShell
      eyebrow={`Community · ${community.category}`}
      title={community.name}
      description={community.description ?? "Een besloten ruimte voor geautoriseerde IN-IT leden."}
    >
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/communities">
          <ArrowLeft className="h-4 w-4" />
          Terug naar communities
        </Link>
      </Button>
      <CommunityRoom
        slug={community.slug}
        currentMember={{ id: member.id, full_name: member.full_name, photo_url: member.photo_url, role: member.role }}
        isAdmin={isAdmin}
        initialJoined={Boolean(membership)}
        initialMembers={members}
        initialPosts={posts}
      />
    </PageShell>
  );
}
