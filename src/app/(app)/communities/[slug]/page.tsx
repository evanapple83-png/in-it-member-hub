import { notFound, redirect } from "next/navigation";
import { HeaderCover } from "@/components/app/community/cards";
import { HeroSettle } from "@/components/app/community/CoverLink";
import { GroupRoom } from "@/components/app/community/GroupRoom";
import { getApprovedCurrentMember } from "@/lib/access";
import { getCurrentAdminRole } from "@/lib/admin-auth";
import { getCommunityBySlug, getCommunityMembers, getMembership, listCommunityPosts } from "@/lib/communities";
import { groupCategory } from "@/lib/format-nl";
import { adminCan } from "@/lib/roles";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const community = await getCommunityBySlug((await params).slug);
  return { title: `${community?.name ?? "Groep"} | IN-IT` };
}

export default async function CommunityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const member = await getApprovedCurrentMember();
  if (!member) redirect("/join?locked=communities");

  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const role = await getCurrentAdminRole();
  const canModerate = role !== null && adminCan(role, "moderate");
  const [members, membership, posts] = await Promise.all([
    getCommunityMembers(community.id),
    getMembership(community.id, member.id).catch(() => null),
    listCommunityPosts(community.id, canModerate),
  ]);

  return (
    <div className="page" data-reveal-group>
      <HeroSettle />
      <GroupRoom
        key={community.id}
        slug={community.slug}
        name={community.name}
        description={community.description}
        category={groupCategory(community.category)}
        cover={<HeaderCover crop={community.slug} src={community.cover_image_url} back="/communities" backLabel="Terug naar groepen" />}
        me={{ id: member.id, full_name: member.full_name, photo_url: member.photo_url ?? null, role: member.role ?? null }}
        canModerate={canModerate}
        initialJoined={Boolean(membership)}
        initialMembers={members}
        initialPosts={posts}
      />
    </div>
  );
}
