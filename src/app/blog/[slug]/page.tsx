import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { BlogPostActions } from "@/components/blog/BlogPostActions";
import { getApprovedCurrentMember } from "@/lib/access";
import { getCurrentAdminRole } from "@/lib/admin-auth";
import { getBlogPostBySlug, getShowcasePost } from "@/lib/blog";
import { adminCan } from "@/lib/roles";
import { initials } from "@/lib/utils";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const member = await getApprovedCurrentMember();
  if (!member) redirect("/join?locked=blog");

  const { slug } = await params;
  const [post, role, showcase] = await Promise.all([getBlogPostBySlug(slug), getCurrentAdminRole(), getShowcasePost()]);
  if (!post) notFound();

  const isAuthor = post.author_id === member.id;
  const isModerator = role !== null && adminCan(role, "moderate");
  // Hidden posts stay reachable for the author and moderators only.
  if (post.status === "hidden" && !isAuthor && !isModerator) notFound();

  const isShowcase = showcase?.id === post.id;
  const published = new Date(post.created_at).toLocaleDateString("nl-NL", { dateStyle: "long" });

  return (
    <PageShell eyebrow="Blog" title={post.title}>
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/blog">
          <ArrowLeft className="h-4 w-4" />
          Terug naar blog
        </Link>
      </Button>

      <article className="max-w-3xl rounded-[2rem] border border-charcoal/10 bg-white/82 p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-deep-blue to-date text-sm font-black text-white">
            {post.author_photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.author_photo} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(post.author_name)
            )}
          </span>
          <div className="min-w-0">
            <p className="font-black text-charcoal">{post.author_name}</p>
            <p className="text-xs text-charcoal/50">
              {published}
              {post.status === "hidden" ? " · verborgen" : ""}
            </p>
          </div>
          {isShowcase ? (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-date/12 px-3 py-1 text-xs font-bold text-date">
              <Trophy className="h-3.5 w-3.5" />
              Showcase van de week
            </span>
          ) : null}
        </div>

        {post.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image_url} alt="" className="mt-6 max-h-[420px] w-full rounded-3xl object-cover" />
        ) : null}

        <div className="mt-6 whitespace-pre-line leading-8 text-charcoal/78">{post.body}</div>

        <BlogPostActions
          postId={post.id}
          slug={post.slug}
          isAuthor={isAuthor}
          isModerator={isModerator}
          status={post.status}
          isShowcase={isShowcase}
        />
      </article>
    </PageShell>
  );
}
