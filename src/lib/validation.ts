import { z } from "zod";

// z.string().url() also accepts javascript: and data:, so every user-supplied link goes through these.
const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/;
const LINKEDIN_IMG_HOST = /(^|\.)licdn\.com$/;

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => parseUrl(v)?.protocol === "https:", "Alleen https-links zijn toegestaan.");

// People paste "linkedin.com/in/naam" without a scheme; add https:// before checking.
export const linkedinUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() && !/^[a-z][a-z0-9+.-]*:/i.test(v.trim()) ? `https://${v.trim()}` : v),
  httpsUrl.refine((v) => {
    const host = parseUrl(v)?.hostname ?? "";
    return host === "linkedin.com" || host.endsWith(".linkedin.com");
  }, "Gebruik een LinkedIn-link."),
);

// Images we render must come from our own Blob store or LinkedIn's CDN (no tracking pixels).
export const imageUrl = httpsUrl.refine((v) => {
  const host = parseUrl(v)?.hostname ?? "";
  return BLOB_HOST.test(host) || LINKEDIN_IMG_HOST.test(host);
}, "Deze afbeelding kan niet worden gebruikt.");

// Empty string or null means "no value"; otherwise it must pass the given schema.
export function optionalUrl<T extends z.ZodTypeAny>(schema: T) {
  return z.union([z.literal(""), schema]).optional().nullable();
}

export const shortText = (max = 160) => z.string().trim().max(max);
export const tagList = z.array(z.string().trim().min(1).max(60)).max(20);

// request.json() throws on malformed bodies; treat that as an empty (invalid) payload.
export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}

// Image magic bytes: the client-sent MIME type and filename are never trusted.
export async function sniffImage(file: File): Promise<{ ext: "png" | "jpg" | "webp"; type: string } | null> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", type: "image/png" };
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  const riff = String.fromCharCode(b[0], b[1], b[2], b[3]);
  const webp = String.fromCharCode(b[8], b[9], b[10], b[11]);
  if (riff === "RIFF" && webp === "WEBP") return { ext: "webp", type: "image/webp" };
  return null;
}
