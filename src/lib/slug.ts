import { randomBytes } from "crypto";

// Server-only slug generator (uses node:crypto — do not import from client components;
// the plain display-slugify for client use lives in lib/utils.ts).
export function uniqueSlug(title: string, fallback: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `${base || fallback}-${randomBytes(3).toString("hex")}`;
}
