import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { isApprovedMember } from "@/lib/access";
import { getCommunities } from "@/lib/communities";

export default async function CommunityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await isApprovedMember())) redirect("/join?locked=communities");

  const { slug } = await params;
  const community = (await getCommunities()).find((item) => item.slug === slug);
  if (!community) notFound();

  return (
    <PageShell eyebrow="Private community" title={community.name} description={community.description ?? "A private space for approved IN-IT members."}>
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/communities">
          <ArrowLeft className="h-4 w-4" />
          Back to communities
        </Link>
      </Button>
      <EmptyState
        title="Community room placeholder"
        description="The MVP now has protected community spaces. Next step: add posts, events, member lists and lightweight moderation per community."
      />
    </PageShell>
  );
}
