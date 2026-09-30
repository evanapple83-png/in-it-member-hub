import { redirect } from "next/navigation";
import { CommunityStats } from "@/components/home/CommunityStats";
import { HeroSection } from "@/components/home/HeroSection";
import { JoinCta } from "@/components/home/JoinCta";
import { getAccessState } from "@/lib/access-state";

export default async function Home() {
  // Approved members start in the hub (/vandaag); everyone else sees the marketing home.
  if ((await getAccessState()).state === "approved") redirect("/vandaag");

  return (
    <>
      <HeroSection members={[]} isMember={false} />
      <CommunityStats members={[]} />
      <JoinCta />
    </>
  );
}
