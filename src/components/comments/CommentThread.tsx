"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Avatar } from "@/components/app/Avatar";
import { EmptyState } from "@/components/app/EmptyState";
import { useToast } from "@/components/app/Toast";
import { Icon } from "@/components/ui/icon";
import { relative } from "@/lib/format-nl";
import type { Comment, CommentTargetType } from "@/lib/types";
import { cn } from "@/lib/utils";
import "./comments.css";

const MAX_LENGTH = 2000;

type Me = { id: string; full_name: string; photo_url: string | null };

/**
 * Reacties onder een verhaal of groepsbericht: lijst + invoerveld.
 * - `initialComments` gegeven: meteen tonen (blogdetail, server-side geladen).
 * - Niet gegeven: laadt zelf bij het eerste tonen (groepsbericht, lazy bij openklappen).
 * - `canPost` false: alleen lezen, met `readOnlyNote` als hint.
 */
export function CommentThread({
  type,
  targetId,
  me,
  canModerate,
  canPost,
  readOnlyNote,
  initialComments,
  variant = "inline",
  heading,
  onCountChange,
}: {
  type: CommentTargetType;
  targetId: string;
  me: Me;
  canModerate: boolean;
  canPost: boolean;
  readOnlyNote?: ReactNode;
  initialComments?: Comment[];
  variant?: "inline" | "story";
  /** Kop met live teller boven de lijst (blogdetail). */
  heading?: string;
  onCountChange?: (count: number) => void;
}) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[] | null>(initialComments ?? null);
  const [loadError, setLoadError] = useState(false);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  const visibleCount = comments?.filter((c) => c.status === "published").length ?? null;

  useEffect(() => {
    if (visibleCount !== null) onCountChange?.(visibleCount);
    // Alleen melden als het aantal verandert, niet bij elke nieuwe callback van de ouder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCount]);

  async function load() {
    setLoadError(false);
    const response = await fetch(`/api/comments?type=${type}&id=${targetId}`).catch(() => null);
    const data = response?.ok ? await response.json().catch(() => null) : null;
    if (!data || !Array.isArray(data.comments)) {
      setLoadError(true);
      return;
    }
    setComments(data.comments);
  }

  useEffect(() => {
    if (initialComments) return;
    let active = true;
    (async () => {
      const response = await fetch(`/api/comments?type=${type}&id=${targetId}`).catch(() => null);
      const data = response?.ok ? await response.json().catch(() => null) : null;
      if (!active) return;
      if (!data || !Array.isArray(data.comments)) setLoadError(true);
      else setComments(data.comments);
    })();
    return () => {
      active = false;
    };
    // Eenmalig laden per doel; initialComments verandert niet na mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, targetId]);

  function resize(element: HTMLTextAreaElement | null) {
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }

  async function submit() {
    const text = body.trim();
    if (!text || busy) {
      input.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);

    // Optimistisch toevoegen; bij een fout terugdraaien en de tekst teruggeven.
    const tempId = `tmp-${Date.now()}`;
    const optimistic: Comment = {
      id: tempId,
      target_type: type,
      target_id: targetId,
      body: text,
      status: "published",
      created_at: new Date().toISOString(),
      author_id: me.id,
      author_name: me.full_name,
      author_photo: me.photo_url,
    };
    setComments((current) => [...(current ?? []), optimistic]);
    setFresh((current) => new Set(current).add(tempId));
    setBody("");
    requestAnimationFrame(() => resize(input.current));

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id: targetId, body: text }),
    }).catch(() => null);
    const data = response ? await response.json().catch(() => null) : null;
    setBusy(false);

    if (!response?.ok || !data?.comment) {
      setComments((current) => (current ?? []).filter((c) => c.id !== tempId));
      setBody((current) => current || text);
      setError(data?.error ?? "Plaatsen lukte niet. Probeer het zo nog eens.");
      requestAnimationFrame(() => resize(input.current));
      return;
    }
    const saved = data.comment as Comment;
    setComments((current) => (current ?? []).map((c) => (c.id === tempId ? saved : c)));
    setFresh((current) => {
      const next = new Set(current);
      next.delete(tempId);
      next.add(saved.id);
      return next;
    });
  }

  async function moderate(comment: Comment) {
    const status = comment.status === "hidden" ? "published" : "hidden";
    const response = await fetch(`/api/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    if (!response?.ok) return toast("Dat lukte niet");
    setComments((current) => (current ?? []).map((c) => (c.id === comment.id ? { ...c, status } : c)));
    toast(status === "hidden" ? "Reactie verborgen" : "Reactie weer zichtbaar");
  }

  async function remove(id: string) {
    setConfirming(null);
    const response = await fetch(`/api/comments/${id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) return toast("Verwijderen lukte niet");
    setComments((current) => (current ?? []).filter((c) => c.id !== id));
    toast("Reactie verwijderd");
  }

  const list = comments ?? [];

  const thread = (
    <div className={cn("replies", variant === "story" && "thread-story")} aria-live="polite">
      {comments === null ? (
        loadError ? (
          <p className="thread-note">
            Reacties laden lukte niet.{" "}
            <button type="button" className="thread-note" style={{ textDecoration: "underline" }} onClick={load}>
              Opnieuw proberen
            </button>
          </p>
        ) : (
          <p className="thread-note">Reacties laden…</p>
        )
      ) : list.length ? (
        <div className="stack" style={{ gap: 10 }} data-reveal-group>
          {list.map((comment) => {
            const pending = comment.id.startsWith("tmp-");
            const mine = comment.author_id === me.id;
            return (
              <div
                key={comment.id}
                className={cn("reply", comment.status === "hidden" && "is-hidden", pending && "is-pending")}
                {...(fresh.has(comment.id) ? { "data-new": "" } : { "data-reveal": "" })}
              >
                <Avatar name={comment.author_name} photoUrl={comment.author_photo} id={comment.author_id ?? undefined} size="xs" />
                <div>
                  <div className="bub">
                    <b>{comment.author_name}</b>
                    <p>{comment.body}</p>
                  </div>
                  <div className="acts">
                    <span suppressHydrationWarning>{pending ? "Plaatsen…" : relative(comment.created_at)}</span>
                    {comment.status === "hidden" ? <span>Verborgen voor leden</span> : null}
                    {!pending && confirming === comment.id ? (
                      <>
                        <span>Verwijderen?</span>
                        <button type="button" className="danger" onClick={() => remove(comment.id)} data-press>
                          Ja, verwijder
                        </button>
                        <button type="button" onClick={() => setConfirming(null)}>
                          Annuleer
                        </button>
                      </>
                    ) : !pending ? (
                      <>
                        {canModerate ? (
                          <button type="button" onClick={() => moderate(comment)} data-press>
                            {comment.status === "hidden" ? "Weer tonen" : "Verbergen"}
                          </button>
                        ) : null}
                        {canModerate || mine ? (
                          <button type="button" onClick={() => setConfirming(comment.id)}>
                            Verwijderen
                          </button>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : variant === "story" ? (
        <EmptyState icon="chat" text={canPost ? "Nog geen reacties. Begin het gesprek." : "Nog geen reacties."} compact />
      ) : (
        <p className="thread-note">{canPost ? "Nog geen reacties. Begin het gesprek." : "Nog geen reacties."}</p>
      )}

      {canPost ? (
        <div>
          <form
            className="replybox"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <Avatar name={me.full_name} photoUrl={me.photo_url} id={me.id} size="xs" />
            <textarea
              ref={input}
              rows={1}
              value={body}
              maxLength={MAX_LENGTH}
              placeholder="Schrijf een reactie"
              aria-label="Reactie"
              onChange={(event) => {
                setBody(event.target.value);
                resize(event.target);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  submit();
                }
              }}
            />
            <button className="round" type="submit" aria-label="Plaats reactie" disabled={busy || !body.trim()} data-press>
              <Icon name="send" />
            </button>
          </form>
          {error ? (
            <p className="err-line" role="alert" style={{ marginTop: 6 }}>
              {error}
            </p>
          ) : null}
        </div>
      ) : readOnlyNote ? (
        <div className="thread-note">{readOnlyNote}</div>
      ) : null}
    </div>
  );

  if (!heading) return thread;
  return (
    <>
      <div className="ph">
        <h3>{heading}</h3>
        {visibleCount ? (
          <span className="muted" style={{ fontSize: 14 }}>
            <span className="num" data-count={visibleCount}>
              {visibleCount}
            </span>{" "}
            {visibleCount === 1 ? "reactie" : "reacties"}
          </span>
        ) : null}
      </div>
      {thread}
    </>
  );
}
