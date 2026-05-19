import { CommunityStats } from "@/components/home/CommunityStats";
import { FeaturedMembers } from "@/components/home/FeaturedMembers";
import { FindMemberSection } from "@/components/home/FindMemberSection";
import { HeroSection } from "@/components/home/HeroSection";
import { JoinCta } from "@/components/home/JoinCta";
import { isApprovedMember } from "@/lib/access";
import { getPublicMembers } from "@/lib/members";

export default async function Home() {
  const approvedMember = await isApprovedMember();
  const members = approvedMember ? await getPublicMembers() : [];

  return (
    <>
      <HeroSection members={members} isMember={approvedMember} />
      <CommunityStats members={members} />
      {approvedMember ? (
        <>
          <FeaturedMembers members={members} />
          <FindMemberSection members={members} />
        </>
      ) : null}
      <JoinCta />
    </>
  );
}
