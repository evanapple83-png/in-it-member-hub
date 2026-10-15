export const MAX_CV_BYTES = 4 * 1024 * 1024;

export function isPdf(bytes: Uint8Array) {
  const header = new TextDecoder().decode(bytes.subarray(0, 8));
  const tail = new TextDecoder().decode(bytes.subarray(Math.max(0, bytes.length - 1024)));
  return /^%PDF-(1\.[0-7]|2\.0)/.test(header) && /%%EOF\s*$/.test(tail);
}

export function safeCvFilename(name: string) {
  const basename = name.split(/[\\/]/).pop() ?? "cv.pdf";
  const clean = basename.replace(/[^a-zA-Z0-9 ._()-]/g, "_").slice(0, 120);
  return clean.replace(/\.pdf$/i, "") + ".pdf";
}

export class CvUploadError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

export async function readCvUpload(request: Request) {
  const maxRequest = MAX_CV_BYTES + 64 * 1024;
  if (Number(request.headers.get("content-length")) > maxRequest) {
    throw new CvUploadError("Je cv mag maximaal 4 MB zijn.", 413);
  }
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    throw new CvUploadError("Kies een PDF-bestand.", 400);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new CvUploadError("Kies een PDF-bestand.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxRequest) {
        await reader.cancel();
        throw new CvUploadError("Je cv mag maximaal 4 MB zijn.", 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const form = await new Response(bytes, { headers: { "content-type": request.headers.get("content-type")! } }).formData()
    .catch(() => { throw new CvUploadError("Ongeldige upload.", 400); });
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) throw new CvUploadError("Kies een PDF-bestand.", 400);
  if (file.size > MAX_CV_BYTES) throw new CvUploadError("Je cv mag maximaal 4 MB zijn.", 413);
  const content = new Uint8Array(await file.arrayBuffer());
  if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf") || !isPdf(content)) {
    throw new CvUploadError("Alleen PDF-bestanden worden ondersteund.", 400);
  }
  return { content, filename: safeCvFilename(file.name), size: file.size };
}
