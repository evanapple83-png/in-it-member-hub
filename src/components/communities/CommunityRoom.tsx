"use client";

import { useState } from "react";
import { EyeOff, Eye, LogIn, LogOut, Send, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { initials } from "@/lib/utils";
import type { CommunityMemberSummary, CommunityPost } from "@/lib/types";

type CurrentMember = { id: string; full_name: string; photo_url?: string | null; role?: string | null };

export function CommunityRoom({
  slug,
  currentMember,
  isAdmin,
  initialJoined,
  initialMembers,
  initialPosts,
}: {
  slug: string;
  currentMember: CurrentMember;
  isAdmin: boolean;
  initialJoined: boolean;
  initialMembers: CommunityMemberSummary[];
  initialPosts: CommunityPost[];
}) {
  const [joined, setJoined] = useState(initialJoined);
  const [members, setMembers] = useState(initialMembers);
  const [posts, setPosts] = useState(initialPosts);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reloadPosts() {
    const response = await fetch(`/api/communities/${slug}/posts`);
    const data = await response.json().catch(() => ({}));
    if (response.ok) setPosts(data.posts ?? []);
  }

  async function toggleMembership() {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/communities/${slug}/membership`, { method: joined ? "DELETE" : "POST" });
    setBusy(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Actie mislukt.");
      return;
    }
    const next = !joined;
    setJoined(next);
    setMembers((current) =>
      next
        ? [...current, { id: currentMember.id, full_name: currentMember.full_name, headline: null, role: currentMember.role ?? null, photo_url: currentMember.photo_url ?? null, community_role: "member" }]
        : current.filter((member) => member.id !== currentMember.id),
    );
  }

  async function submitPost() {
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/communities/${slug}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setBusy(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Plaatsen mislukt.");
      return;
    }
    setBody("");
    await reloadPosts();
  }

  async function moderate(postId: string, status: "published" | "hidden") {
    await fetch(`/api/community-posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await reloadPosts();
  }

  async function remove(postId: string) {
    await fetch(`/api/community-posts/${postId}`, { method: "DELETE" });
    await reloadPosts();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-charcoal/10 bg-white/82 p-5 shadow-sm">
          <p className="text-sm font-semibold text-charcoal/65">
            {joined ? "Je bent lid van deze community." : "Word lid om mee te doen aan het gesprek."}
          </p>
          <Button onClick={toggleMembership} variant={joined ? "outline" : "primary"} disabled={busy}>
            {joined ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {joined ? "Verlaten" : "Word lid"}
          </Button>
        </div>

        {joined ? (
          <div className="rounded-[2rem] border border-charcoal/10 bg-white/82 p-5 shadow-sm">
            <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Deel iets met de community..." />
            <div className="mt-3 flex justify-end">
              <Button onClick={submitPost} disabled={busy || !body.trim()}>
                <Send className="h-4 w-4" />
                Plaatsen
              </Button>
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm font-semibold text-date">{error}</p> : null}

        <div className="grid gap-3">
          {posts.length === 0 ? (
            <p className="rounded-[2rem] border border-charcoal/10 bg-white/70 p-6 text-sm font-semibold text-charcoal/55">
              Nog geen berichten. Wees de eerste die iets deelt.
            </p>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className={`rounded-[2rem] border border-charcoal/10 bg-white/82 p-5 shadow-sm ${post.status === "hidden" ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-deep-blue to-date text-sm font-black text-white">
                    {post.author_photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.author_photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(post.author_name)
                    )}
                  </span>
                  <div>
                    <p className="font-black text-charcoal">{post.author_name}</p>
                    <p className="text-xs text-charcoal/50">
                      {new Date(post.created_at).toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" })}
                      {post.status === "hidden" ? " · verborgen" : ""}
                    </p>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line leading-7 text-charcoal/78">{post.body}</p>
                {isAdmin || post.author_id === currentMember.id ? (
                  <div className="mt-3 flex gap-2 border-t border-charcoal/8 pt-3">
                    {isAdmin ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moderate(post.id, post.status === "hidden" ? "published" : "hidden")}
                      >
                        {post.status === "hidden" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        {post.status === "hidden" ? "Tonen" : "Verbergen"}
                      </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" onClick={() => remove(post.id)}>
                      <Trash2 className="h-4 w-4" />
                      Verwijderen
                    </Button>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </div>

      <aside className="h-fit rounded-[2rem] border border-charcoal/10 bg-white/82 p-5 shadow-sm">
        <h2 className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-charcoal/45">
          <Users className="h-4 w-4" />
          Leden ({members.length})
        </h2>
        <ul className="mt-4 grid gap-3">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-deep-blue to-date text-xs font-black text-white">
                {member.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(member.full_name)
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-charcoal">{member.full_name}</p>
                {member.role ? <p className="truncate text-xs text-charcoal/50">{member.role}</p> : null}
              </div>
            </li>
          ))}
          {members.length === 0 ? <li className="text-sm text-charcoal/50">Nog geen leden.</li> : null}
        </ul>
      </aside>
    </div>
  );
}
