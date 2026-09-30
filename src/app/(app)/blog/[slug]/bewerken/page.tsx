import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BlogEditor } from "@/components/blog/BlogEditor";
import { Icon } from "@/components/ui/icon";
import { getApprovedCurrentMember } from "@/lib/access";
import { getCurrentAdminRole } from "@/lib/admin-auth";
import { getBlogPostBySlug } from "@/lib/blog";
import { adminCan } from "@/lib/roles";

export const metadata = { title: "Verhaal bewerken | IN-IT" };

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
    <div className="page" style={{ maxWidth: 820 }}>
      <div className="hello">
        <div>
          <h1>Verhaal bewerken</h1>
          <p>{post.title}</p>
        </div>
        <Link className="btn ghost" href={`/blog/${post.slug}`}>
          <Icon name="back" />
          Terug naar verhaal
        </Link>
      </div>
      <BlogEditor
        postId={post.id}
        slug={post.slug}
        initialTitle={post.title}
        initialBody={post.body}
        initialCoverImageUrl={post.cover_image_url ?? ""}
      />
    </div>
  );
}
