import { redirect } from "next/navigation";
import { CommunityBenefits, CommunityStory, HowToJoin } from "@/components/home/CommunitySections";
import { FeaturedMembers } from "@/components/home/FeaturedMembers";
import { HeroSection } from "@/components/home/HeroSection";
import { JoinCta } from "@/components/home/JoinCta";
import { getAccessState } from "@/lib/access-state";
import { getPublicProfiles } from "@/lib/members";

export const metadata = {
  title: "IN-IT | Iraqi tech professionals in the Netherlands",
  description: "Meet the Iraqi tech community in the Netherlands. Discover public member profiles, share expertise, find connections and request to join IN-IT.",
};

export default async function Home() {
  // Approved members start in the hub (/vandaag); everyone else sees the marketing home.
  if ((await getAccessState()).state === "approved") redirect("/vandaag");
  const developmentPreview = process.env.NODE_ENV !== "production";
  const members = await getPublicProfiles({ includeDemo: developmentPreview }).catch((error) => {
    console.error("[home] member preview unavailable", error);
    return [];
  });

  return (
    <>
      <HeroSection />
      <FeaturedMembers members={members.slice(0, 6)} developmentPreview={developmentPreview} />
      <CommunityBenefits />
      <HowToJoin />
      <CommunityStory />
      <JoinCta />
    </>
  );
}
