import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { BlogEditor } from "@/components/blog/BlogEditor";
import { getApprovedCurrentMember } from "@/lib/access";
import { getCurrentAdminRole } from "@/lib/admin-auth";
import { getBlogPostBySlug } from "@/lib/blog";
import { adminCan } from "@/lib/roles";

export default async function EditBlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const member = await getApprovedCurrentMember();
  if (!member) redirect("/join?locked=blog");

  const { slug } = await params;
  const [post, role] = await Promise.all([getBlogPostBySlug(slug), getCurrentAdminRole()]);
  if (!post) notFound();

  const isAuthor = post.author_id === member.id;
  const isModerator = role !== null && adminCan(role, "moderate");
  if (!isAuthor && !isModerator) redirect(`/blog/${post.slug}`);

  return (
    <PageShell eyebrow="Blog" title="Verhaal bewerken">
      <Button asChild variant="ghost" className="mb-6">
        <Link href={`/blog/${post.slug}`}>
          <ArrowLeft className="h-4 w-4" />
          Terug naar verhaal
        </Link>
      </Button>
      <BlogEditor
        postId={post.id}
        slug={post.slug}
        initialTitle={post.title}
        initialBody={post.body}
        initialCoverImageUrl={post.cover_image_url ?? ""}
      />
    </PageShell>
  );
}
