import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { BlogEditor } from "@/components/blog/BlogEditor";
import { getApprovedCurrentMember } from "@/lib/access";

export default async function WriteBlogPostPage() {
  const member = await getApprovedCurrentMember();
  if (!member) redirect("/join?locked=blog");

  return (
    <PageShell
      eyebrow="Blog"
      title="Deel jouw verhaal"
      description="Schrijf over een ervaring, project of les die je met de community wilt delen. Je verhaal is alleen zichtbaar voor ingelogde leden."
    >
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/blog">
          <ArrowLeft className="h-4 w-4" />
          Terug naar blog
        </Link>
      </Button>
      <BlogEditor />
    </PageShell>
  );
}
