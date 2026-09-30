"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";

// Author + beheerder actions on a blog post detail page.
export function BlogPostActions({
  postId,
  slug,
  isAuthor,
  isModerator,
  status,
  isShowcase,
}: {
  postId: string;
  slug: string;
  isAuthor: boolean;
  isModerator: boolean;
  status: "published" | "hidden";
  isShowcase: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/blog/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Actie mislukt.");
      return;
    }
    router.refresh();
  }

  async function remove() {
    if (!window.confirm("Dit verhaal definitief verwijderen?")) return;
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/blog/${postId}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Verwijderen mislukt.");
      return;
    }
    router.push("/blog");
    router.refresh();
  }

  if (!isAuthor && !isModerator) return null;

  return (
    <div className="modbar">
      <Link className="btn ghost sm" href={`/blog/${slug}/bewerken`}>
        <Icon name="pen" />
        Bewerken
      </Link>
      {isModerator ? (
        <>
          <button type="button" className="btn ghost sm" disabled={busy} onClick={() => patch({ status: status === "hidden" ? "published" : "hidden" })}>
            {status === "hidden" ? "Weer tonen" : "Verbergen"}
          </button>
          <button type="button" className="btn ghost sm" disabled={busy} onClick={() => patch({ showcase: !isShowcase })}>
            <Icon name="book" />
            {isShowcase ? "Niet meer uitlichten" : "Maak verhaal van de week"}
          </button>
        </>
      ) : null}
      <button type="button" className="btn ghost sm danger" disabled={busy} onClick={remove}>
        Verwijderen
      </button>
      {error ? (
        <p className="err-line" role="alert" style={{ flexBasis: "100%" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
