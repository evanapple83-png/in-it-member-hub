import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";

type StoredCv = { storageProvider: string; storageKey: string };
const KEY = /^member-cvs\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/;

function localStorageEnabled() {
  if (process.env.NODE_ENV !== "development" || process.env.VERCEL) return false;
  try { return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.DATABASE_URL ?? "").hostname); }
  catch { return false; }
}

function localPath(key: string) {
  if (!localStorageEnabled() || !KEY.test(key)) throw new Error("Local CV storage unavailable");
  return path.join(process.cwd(), ".local", key);
}

export function hasCvStorage() {
  return Boolean(process.env.CV_BLOB_READ_WRITE_TOKEN) || localStorageEnabled();
}

export async function storeCv(memberId: string, content: Uint8Array): Promise<StoredCv> {
  const key = `member-cvs/${memberId}/${randomUUID()}.pdf`;
  if (!KEY.test(key)) throw new Error("Invalid CV storage key");
  if (process.env.CV_BLOB_READ_WRITE_TOKEN) {
    const blob = await put(key, Buffer.from(content), {
      access: "private", contentType: "application/pdf", addRandomSuffix: false,
      token: process.env.CV_BLOB_READ_WRITE_TOKEN,
    });
    return { storageProvider: "blob", storageKey: blob.pathname };
  }
  const filename = localPath(key);
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, content, { mode: 0o600, flag: "wx" });
  return { storageProvider: "local", storageKey: key };
}

export async function readStoredCv(cv: StoredCv) {
  if (!KEY.test(cv.storageKey)) throw new Error("Invalid CV storage key");
  if (cv.storageProvider === "local") {
    return new Uint8Array(await readFile(localPath(cv.storageKey)));
  }
  if (cv.storageProvider !== "blob" || !process.env.CV_BLOB_READ_WRITE_TOKEN) throw new Error("CV storage unavailable");
  const result = await get(cv.storageKey, { access: "private", useCache: false, token: process.env.CV_BLOB_READ_WRITE_TOKEN });
  if (!result || result.statusCode !== 200) throw new Error("CV not found");
  return result.stream;
}

export async function deleteStoredCv(cv: StoredCv) {
  if (!KEY.test(cv.storageKey)) throw new Error("Invalid CV storage key");
  if (cv.storageProvider === "local") {
    await unlink(localPath(cv.storageKey)).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
  } else if (cv.storageProvider === "blob" && process.env.CV_BLOB_READ_WRITE_TOKEN) {
    await del(cv.storageKey, { token: process.env.CV_BLOB_READ_WRITE_TOKEN });
  } else throw new Error("CV storage unavailable");
}
