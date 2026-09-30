"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";

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
    <section className="panel cform">
      <div className="f">
        <label htmlFor="blog-title" className="lbl">
          Titel
        </label>
        <input
          id="blog-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Waar gaat jouw verhaal over?"
          maxLength={140}
        />
      </div>
      <div className="f">
        <label htmlFor="blog-body" className="lbl">
          Verhaal
        </label>
        <textarea
          id="blog-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Een project, een overstap, een les die je leerde. Schrijf het zoals je het aan een collega zou vertellen."
          rows={14}
        />
        <span className="hint">Witregels blijven staan. Alleen ingelogde leden kunnen je verhaal lezen.</span>
      </div>
      <div className="f">
        <label htmlFor="blog-cover" className="lbl">
          Omslagfoto (optioneel)
        </label>
        <input
          id="blog-cover"
          value={coverImageUrl}
          onChange={(event) => setCoverImageUrl(event.target.value)}
          placeholder="Plak hier het webadres van een foto"
          inputMode="url"
        />
        <span className="hint">Laat je dit leeg, dan krijgt je verhaal een beeld uit de IN-IT-huisstijl.</span>
      </div>

      {error ? (
        <p className="err-line" role="alert">
          {error}
        </p>
      ) : null}

      <div className="acts">
        <button type="button" className="btn primary" onClick={submit} disabled={busy || !valid}>
          <Icon name="send" />
          {postId ? "Wijzigingen opslaan" : "Publiceren"}
        </button>
      </div>
    </section>
  );
}
