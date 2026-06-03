"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Trash2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="mt-6 border-t border-charcoal/8 pt-4">
      <div className="flex flex-wrap gap-2">
        {isAuthor || isModerator ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/blog/${slug}/bewerken`}>
              <Pencil className="h-4 w-4" />
              Bewerken
            </Link>
          </Button>
        ) : null}
        {isModerator ? (
          <>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => patch({ status: status === "hidden" ? "published" : "hidden" })}>
              {status === "hidden" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {status === "hidden" ? "Tonen" : "Verbergen"}
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => patch({ showcase: !isShowcase })}>
              <Trophy className="h-4 w-4" />
              {isShowcase ? "Showcase verwijderen" : "Maak Showcase van de week"}
            </Button>
          </>
        ) : null}
        <Button size="sm" variant="ghost" disabled={busy} onClick={remove}>
          <Trash2 className="h-4 w-4" />
          Verwijderen
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm font-semibold text-date">{error}</p> : null}
    </div>
  );
}
