import { cn, initials } from "@/lib/utils";

// Soft tints from the prototype; picked by a stable hash of the id (or name).
export const AVATAR_TINTS = ["#f3dcd4", "#dbe3f1", "#e6e0f0", "#dcebe2", "#f2e8d3", "#e3eef0"];

export function tintFor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return AVATAR_TINTS[Math.abs(hash) % AVATAR_TINTS.length];
}

export type AvatarSize = "lg" | "md" | "sm" | "xs";

// Round avatar: photo when there is one, otherwise initials on a tint. `.av` in app.css.
export function Avatar({
  name,
  photoUrl,
  id,
  size = "md",
  className,
}: {
  name: string;
  photoUrl?: string | null;
  id?: string;
  size?: AvatarSize;
  className?: string;
}) {
  const sizeClass = size === "md" ? "" : size === "lg" ? "lg" : size;
  return (
    <span
      className={cn("av", sizeClass, className)}
      style={photoUrl ? undefined : { background: tintFor(id ?? name) }}
      aria-hidden="true"
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- member photos come from several hosts
        <img src={photoUrl} alt="" loading="lazy" decoding="async" />
      ) : (
        initials(name) || "?"
      )}
    </span>
  );
}
