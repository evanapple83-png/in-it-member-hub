import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/app/EmptyState";
import { FeatureStory, StoryTile } from "@/components/app/community/cards";
import { Icon } from "@/components/ui/icon";
import { getApprovedCurrentMember } from "@/lib/access";
import { getCurrentAdminRole } from "@/lib/admin-auth";
import { getShowcasePost, listBlogPosts } from "@/lib/blog";
import { adminCan } from "@/lib/roles";

export const metadata = { title: "Verhalen | IN-IT" };

export default async function BlogPage() {
  const member = await getApprovedCurrentMember();
  if (!member) redirect("/join?locked=blog");

  const role = await getCurrentAdminRole();
  const isModerator = role !== null && adminCan(role, "moderate");
  const [posts, showcase] = await Promise.all([listBlogPosts(isModerator), getShowcasePost()]);
  const visible = posts.filter((post) => post.status === "published");
  const top = showcase ?? visible[0] ?? null;
  const rest = posts.filter((post) => post.id !== top?.id);

  const write = (
    <Link className="btn primary" href="/blog/schrijven">
      <Icon name="pen" />
      Schrijf een verhaal
    </Link>
  );

  return (
    <div className="page">
      <div className="hello">
        <div>
          <h1>Verhalen</h1>
          <p>Leden schrijven over projecten, carrièrestappen en lessen.</p>
        </div>
        {posts.length ? write : null}
      </div>

      {posts.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon="book"
            title="Nog geen verhalen"
            text="Het eerste verhaal staat meteen bovenaan op Vandaag. Een project, een overstap, iets wat je had willen weten toen je begon."
            action={
              <Link className="btn primary" href="/blog/schrijven">
                Schrijf het eerste verhaal
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {top ? <FeatureStory post={top} kicker={showcase && top.id === showcase.id ? "Verhaal van de week" : "Nieuwste verhaal"} /> : null}
          {rest.length ? (
            <div className="tiles">
              {rest.map((post) => (
                <StoryTile key={post.id} post={post} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
