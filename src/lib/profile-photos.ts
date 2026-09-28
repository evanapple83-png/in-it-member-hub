import { del, list } from "@vercel/blob";

// Uploads live under profile-photos/<userId>/ (see /api/upload/profile-photo). Removing the
// account must remove the photos too: they are public URLs and would otherwise outlive the member.
export async function deleteProfilePhotos(userId: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const prefix = `profile-photos/${userId}/`;
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor });
    if (page.blobs.length) await del(page.blobs.map((blob) => blob.url));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}
