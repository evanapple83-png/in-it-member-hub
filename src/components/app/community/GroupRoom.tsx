"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { Avatar } from "@/components/app/Avatar";
import { EmptyState } from "@/components/app/EmptyState";
import { Pills } from "@/components/app/Pills";
import { useToast } from "@/components/app/Toast";
import { JoinButton } from "@/components/app/community/JoinButton";
import { Icon } from "@/components/ui/icon";
import { plural, relative } from "@/lib/format-nl";
import type { CommunityMemberSummary, CommunityPost } from "@/lib/types";
import { cn } from "@/lib/utils";

type Me = { id: string; full_name: string; photo_url: string | null; role: string | null };

// Group detail: header (join + avatar stack), Gesprek/Leden, composer, posts and moderation.
export function GroupRoom({
  slug,
  name,
  description,
  category,
  cover,
  me,
  canModerate,
  initialJoined,
  initialMembers,
  initialPosts,
}: {
  slug: string;
  name: string;
  description: string | null;
  category: string;
  cover: ReactNode;
  me: Me;
  canModerate: boolean;
  initialJoined: boolean;
  initialMembers: CommunityMemberSummary[];
  initialPosts: CommunityPost[];
}) {
  const { toast } = useToast();
  const [joined, setJoined] = useState(initialJoined);
  const [popMe, setPopMe] = useState(false);
  const [tab, setTab] = useState<"gesprek" | "leden">("gesprek");
  const [posts, setPosts] = useState(initialPosts);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  const others = initialMembers.filter((m) => m.id !== me.id);
  const meSummary: CommunityMemberSummary = { ...me, headline: null, community_role: "member" };
  const people = joined ? [meSummary, ...others] : others;
  const admins = initialMembers.filter((m) => m.community_role && m.community_role !== "member");

  function onJoinChange(next: boolean) {
    setJoined(next);
    setPopMe(next);
  }

  async function reload(previous: CommunityPost[]) {
    const response = await fetch(`/api/communities/${slug}/posts`).catch(() => null);
    const data = response?.ok ? await response.json().catch(() => ({})) : {};
    if (!Array.isArray(data.posts)) return;
    const known = new Set(previous.map((p) => p.id));
    setFresh(new Set((data.posts as CommunityPost[]).filter((p) => !known.has(p.id)).map((p) => p.id)));
    setPosts(data.posts);
  }

  async function submit() {
    const text = body.trim();
    if (!text) {
      textarea.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/communities/${slug}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    }).catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      const data = await response?.json().catch(() => ({}));
      setError(data?.error ?? "Plaatsen lukte niet. Probeer het zo nog eens.");
      return;
    }
    setBody("");
    toast("Geplaatst");
    await reload(posts);
  }

  async function moderate(postId: string, status: "published" | "hidden") {
    const response = await fetch(`/api/community-posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    if (!response?.ok) return toast("Dat lukte niet");
    toast(status === "hidden" ? "Bericht verborgen" : "Bericht weer zichtbaar");
    setFresh(new Set());
    await reload(posts);
  }

  async function remove(postId: string) {
    if (!window.confirm("Dit bericht verwijderen?")) return;
    const response = await fetch(`/api/community-posts/${postId}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) return toast("Dat lukte niet");
    toast("Bericht verwijderd");
    setPosts((current) => current.filter((p) => p.id !== postId));
  }

  const count = people.length;

  return (
    <>
      <section className="panel flush ghead">
        {cover}
        <div className="gb">
          <div>
            <span className="chip tag">{category}</span>
            <h1 style={{ marginTop: 8 }}>{name}</h1>
            {description ? <p>{description}</p> : null}
            <div className="meta">
              {count ? (
                <span className="avstack">
                  {people.slice(0, 5).map((m, i) => (
                    <Avatar
                      key={m.id}
                      name={m.full_name}
                      photoUrl={m.photo_url}
                      id={m.id}
                      size="xs"
                      className={cn(i === 0 && popMe && m.id === me.id && "pop")}
                    />
                  ))}
                </span>
              ) : null}
              <span className="muted num" style={{ fontSize: 14 }}>
                {count ? plural(count, "lid", "leden") : "Nog geen leden"}
              </span>
            </div>
          </div>
          <JoinButton key={joined ? "in" : "out"} slug={slug} name={name} joined={joined} size="md" onChange={onJoinChange} />
        </div>
      </section>

      <div className="cols" style={admins.length ? undefined : { gridTemplateColumns: "minmax(0, 1fr)" }}>
        <div className="stack">
          <Pills
            items={[
              { key: "gesprek", label: "Gesprek" },
              { key: "leden", label: "Leden" },
            ]}
            active={tab}
            onChange={(key) => setTab(key as "gesprek" | "leden")}
            label="Onderdelen van de groep"
            className="seg-pills"
          />

          {tab === "leden" ? (
            people.length ? (
              <div className="mlist">
                {people.map((m) => (
                  <Link key={m.id} href={`/members/${m.id}`} className="mrow">
                    <Avatar name={m.full_name} photoUrl={m.photo_url} id={m.id} />
                    <span className="t">
                      <b>{m.full_name}</b>
                      {m.role || m.headline ? <small>{m.role || m.headline}</small> : null}
                    </span>
                    <Icon name="arrow" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="panel">
                <EmptyState icon="users" title="Nog geen leden" text="Word als eerste lid en start het gesprek." />
              </div>
            )
          ) : (
            <>
              {joined ? (
                <section className="panel">
                  <div className="composer">
                    <Avatar name={me.full_name} photoUrl={me.photo_url} id={me.id} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <textarea
                        ref={textarea}
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit();
                        }}
                        placeholder={`Deel iets met ${name}`}
                        aria-label="Nieuw bericht"
                        maxLength={4000}
                      />
                      {error ? (
                        <p className="err-line" role="alert" style={{ marginTop: 6 }}>
                          {error}
                        </p>
                      ) : null}
                      <div className="actions">
                        <button className="btn primary sm" type="button" onClick={submit} disabled={busy || !body.trim()}>
                          <Icon name="send" />
                          Plaatsen
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <p className="muted">Word lid om mee te praten in deze groep.</p>
                  <JoinButton key="inline" slug={slug} name={name} joined={false} onChange={onJoinChange} />
                </section>
              )}

              <div className="stack">
                {posts.length ? (
                  posts.map((post) => {
                    const mine = post.author_id === me.id;
                    return (
                      <article key={post.id} className={cn("post", fresh.has(post.id) && "enter", post.status === "hidden" && "is-hidden")}>
                        <div className="who">
                          <Avatar name={post.author_name} photoUrl={post.author_photo} id={post.author_id ?? undefined} size="sm" />
                          <div>
                            <b>{post.author_name}</b>
                            <small suppressHydrationWarning>
                              {relative(post.created_at)}
                              {post.status === "hidden" ? " · verborgen voor leden" : ""}
                            </small>
                          </div>
                        </div>
                        <p className="txt">{post.body}</p>
                        {canModerate || mine ? (
                          <div className="bar">
                            {canModerate ? (
                              <button
                                type="button"
                                className="btn ghost sm"
                                onClick={() => moderate(post.id, post.status === "hidden" ? "published" : "hidden")}
                              >
                                {post.status === "hidden" ? "Weer tonen" : "Verbergen"}
                              </button>
                            ) : null}
                            <button type="button" className="btn ghost sm danger" onClick={() => remove(post.id)}>
                              Verwijderen
                            </button>
                          </div>
                        ) : null}
                      </article>
                    );
                  })
                ) : (
                  <div className="panel">
                    <EmptyState
                      icon="chat"
                      title="Nog geen berichten"
                      text={
                        joined
                          ? "Stel een vraag of deel iets wat je tegenkwam. Het eerste bericht zet de toon."
                          : "Zodra iemand iets deelt, zie je het hier."
                      }
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {admins.length ? (
          <aside className="stack aside">
            <section className="panel">
              <div className="ph">
                <h3>Beheerders</h3>
              </div>
              {admins.map((m) => (
                <Link key={m.id} href={`/members/${m.id}`} className="person">
                  <Avatar name={m.full_name} photoUrl={m.photo_url} id={m.id} size="sm" />
                  <span className="t">
                    <b>{m.full_name}</b>
                    <small>Beheerder</small>
                  </span>
                </Link>
              ))}
            </section>
          </aside>
        ) : null}
      </div>
    </>
  );
}
