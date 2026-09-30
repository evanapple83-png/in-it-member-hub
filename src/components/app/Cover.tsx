import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Crops of the IN-IT hero image (public/in-it-hero-background.png), see `.c-*` in app.css.
export const COVER_CROPS = ["c-arch", "c-canal", "c-wave", "c-circuit", "c-lion", "c-bridge", "c-wide"] as const;
export type CoverCrop = (typeof COVER_CROPS)[number];

// Fixed crops for the known groups (as in the prototype); anything else gets a stable pick.
const KNOWN: Record<string, CoverCrop> = {
  "security-specialists": "c-arch",
  engineers: "c-circuit",
  "product-design": "c-wave",
  football: "c-canal",
};

export function cropFor(key: string): CoverCrop {
  if (KNOWN[key]) return KNOWN[key];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return COVER_CROPS[Math.abs(hash) % (COVER_CROPS.length - 1)];
}

// Cover block: a hero crop, or a real image when `src` is set. `zoom` scales it on hover.
export function Cover({
  crop = "c-wide",
  src,
  zoom = false,
  className,
  style,
  children,
}: {
  crop?: CoverCrop;
  src?: string | null;
  zoom?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn("cover", src ? "has-img" : crop, zoom && "cover-zoom", className)}
      style={src ? { backgroundImage: `url(${JSON.stringify(src)})`, ...style } : style}
      aria-hidden={children ? undefined : true}
    >
      <div className="cover-in" />
      {children}
    </div>
  );
}
