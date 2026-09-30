import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/app/Avatar";
import { HeaderCover } from "@/components/app/community/cards";
import { HeroSettle } from "@/components/app/community/CoverLink";
import { BlogPostActions } from "@/components/blog/BlogPostActions";
import { CommentThread } from "@/components/comments/CommentThread";
import { Icon } from "@/components/ui/icon";
import { getApprovedCurrentMember } from "@/lib/access";
import { getCurrentAdminRole } from "@/lib/admin-auth";
import { getBlogPostBySlug, getShowcasePost } from "@/lib/blog";
import { listComments } from "@/lib/comments";
import { longDate } from "@/lib/format-nl";
import { adminCan } from "@/lib/roles";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getBlogPostBySlug((await params).slug).catch(() => null);
  return { title: `${post?.status === "published" ? post.title : "Verhaal"} | IN-IT` };
}

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
  // Reacties server-side, zodat teller en lijst direct staan. Faalt open naar leeg.
  const comments = await listComments("blog_post", post.id, isModerator).catch(() => []);

  return (
    <div className="page">
      <HeroSettle />
      <section className="panel flush ghead">
        <HeaderCover crop={post.slug} src={post.cover_image_url} back="/blog" backLabel="Terug naar verhalen" />
        <div className="gb">
          <div>
            {isShowcase ? (
              <span className="kick">
                <Icon name="book" />
                Verhaal van de week
              </span>
            ) : null}
            <h1 style={{ marginTop: isShowcase ? 8 : 0 }}>{post.title}</h1>
            <div className="meta">
              <Avatar name={post.author_name} photoUrl={post.author_photo} id={post.author_id ?? undefined} size="sm" />
              {post.author_id ? (
                <Link href={`/members/${post.author_id}`} className="muted" style={{ fontSize: 14 }}>
                  {post.author_name}
                </Link>
              ) : (
                <span className="muted" style={{ fontSize: 14 }}>
                  {post.author_name}
                </span>
              )}
              <span className="muted" style={{ fontSize: 14 }}>
                · {longDate(post.created_at)}
                {post.status === "hidden" ? " · verborgen voor leden" : ""}
              </span>
            </div>
          </div>
        </div>
      </section>

      <article className="panel story">
        <p className="prose">{post.body}</p>
        <BlogPostActions
          postId={post.id}
          slug={post.slug}
          isAuthor={isAuthor}
          isModerator={isModerator}
          status={post.status}
          isShowcase={isShowcase}
        />
      </article>

      <section className="panel" aria-label="Reacties" data-reveal>
        <CommentThread
          type="blog_post"
          targetId={post.id}
          me={{ id: member.id, full_name: member.full_name, photo_url: member.photo_url ?? null }}
          canModerate={isModerator}
          canPost={post.status === "published"}
          readOnlyNote="Reageren kan weer zodra dit verhaal zichtbaar is."
          initialComments={comments}
          variant="story"
          heading="Reacties"
        />
      </section>

      <p className="muted" style={{ textAlign: "center", fontSize: 14 }}>
        Heb je zelf iets meegemaakt dat anderen verder helpt?{" "}
        <Link href="/blog/schrijven" style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 2 }}>
          Schrijf zelf een verhaal
        </Link>
      </p>
    </div>
  );
}
