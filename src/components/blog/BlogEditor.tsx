"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

// Create + edit form for member blog posts. With `postId` it PATCHes an existing post,
// otherwise it POSTs a new one.
export function BlogEditor({
  postId,
  slug,
  initialTitle = "",
  initialBody = "",
  initialCoverImageUrl = "",
}: {
  postId?: string;
  slug?: string;
  initialTitle?: string;
  initialBody?: string;
  initialCoverImageUrl?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [coverImageUrl, setCoverImageUrl] = useState(initialCoverImageUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const payload = { title, body, cover_image_url: coverImageUrl.trim() };
    const response = await fetch(postId ? `/api/blog/${postId}` : "/api/blog", {
      method: postId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Opslaan mislukt. Probeer het opnieuw.");
      return;
    }
    const target = data.slug ?? slug;
    router.push(target ? `/blog/${target}` : "/blog");
    router.refresh();
  }

  const valid = title.trim().length >= 3 && body.trim().length >= 10;

  return (
    <div className="grid max-w-3xl gap-5 rounded-[2rem] border border-charcoal/10 bg-white/82 p-7 shadow-sm">
      <div className="grid gap-1.5">
        <label htmlFor="blog-title" className="text-sm font-bold text-charcoal">
          Titel
        </label>
        <Input
          id="blog-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Waar gaat jouw verhaal over?"
          maxLength={140}
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="blog-body" className="text-sm font-bold text-charcoal">
          Verhaal
        </label>
        <Textarea
          id="blog-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Deel je ervaring met de community: een project, een carrièrestap, een les die je leerde..."
          rows={14}
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="blog-cover" className="text-sm font-bold text-charcoal">
          Coverafbeelding (optioneel, URL)
        </label>
        <Input
          id="blog-cover"
          value={coverImageUrl}
          onChange={(event) => setCoverImageUrl(event.target.value)}
          placeholder="https://..."
          inputMode="url"
        />
      </div>

      {error ? <p className="text-sm font-semibold text-date">{error}</p> : null}

      <div className="flex justify-end">
        <Button onClick={submit} disabled={busy || !valid}>
          <Send className="h-4 w-4" />
          {postId ? "Wijzigingen opslaan" : "Publiceren"}
        </Button>
      </div>
    </div>
  );
}
