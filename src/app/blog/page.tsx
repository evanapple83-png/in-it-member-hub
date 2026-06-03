import Link from "next/link";
import { redirect } from "next/navigation";
import { PenLine, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { getApprovedCurrentMember } from "@/lib/access";
import { getCurrentAdminRole } from "@/lib/admin-auth";
import { excerpt, getShowcasePost, listBlogPosts } from "@/lib/blog";
import { adminCan } from "@/lib/roles";
import { initials } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("nl-NL", { dateStyle: "long" });
}

export default async function BlogPage() {
  const member = await getApprovedCurrentMember();
  if (!member) redirect("/join?locked=blog");

  const role = await getCurrentAdminRole();
  const isModerator = role !== null && adminCan(role, "moderate");
  const [posts, showcase] = await Promise.all([listBlogPosts(isModerator), getShowcasePost()]);
  const rest = showcase ? posts.filter((post) => post.id !== showcase.id) : posts;

  return (
    <PageShell
      eyebrow="Blog"
      title="Verhalen uit de community"
      description="Leden schrijven over hun ervaringen: projecten, carrièrestappen en lessen. Zichtbaar voor ingelogde leden."
    >
      <div className="mb-8 flex justify-end">
        <Button asChild>
          <Link href="/blog/schrijven">
            <PenLine className="h-4 w-4" />
            Deel jouw verhaal
          </Link>
        </Button>
      </div>

      {showcase ? (
        <section className="mb-10">
          <Link
            href={`/blog/${showcase.slug}`}
            className="block rounded-[2rem] border border-date/25 bg-gradient-to-br from-deep-blue to-deep-blue/88 p-8 text-white shadow-lg transition hover:shadow-xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-date/90 px-4 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-white">
              <Trophy className="h-4 w-4" />
              Showcase van de week
            </span>
            <h2 className="mt-4 text-3xl font-black leading-tight">{showcase.title}</h2>
            <p className="mt-3 max-w-3xl leading-7 text-white/82">{excerpt(showcase.body)}</p>
            <p className="mt-4 text-sm font-semibold text-white/70">
              {showcase.author_name} · {formatDate(showcase.created_at)}
            </p>
          </Link>
        </section>
      ) : null}

      {posts.length === 0 ? (
        <EmptyState
          title="Nog geen verhalen"
          description="Wees de eerste die een ervaring deelt met de community."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {rest.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <article
      className={`rounded-[2rem] border border-charcoal/10 bg-white/82 p-6 shadow-sm transition hover:shadow-md ${post.status === "hidden" ? "opacity-60" : ""}`}
    >
      <h3 className="text-xl font-black leading-snug text-charcoal">
        <Link href={`/blog/${post.slug}`} className="hover:text-deep-blue">
          {post.title}
        </Link>
      </h3>
      <p className="mt-3 leading-7 text-charcoal/68">{excerpt(post.body, 180)}</p>
      <div className="mt-4 flex items-center gap-3 border-t border-charcoal/8 pt-4">
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-deep-blue to-date text-xs font-black text-white">
          {post.author_photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author_photo} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(post.author_name)
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-charcoal">{post.author_name}</p>
          <p className="text-xs text-charcoal/50">
            {formatDate(post.created_at)}
            {post.status === "hidden" ? " · verborgen" : ""}
          </p>
        </div>
      </div>
    </article>
  );
}
