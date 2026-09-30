import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// White rounded section (`.panel`). Optional header row with title, count badge and action.
export function Panel({
  title,
  count,
  countAccent = false,
  action,
  flush = false,
  as: Tag = "section",
  reveal = false,
  className,
  children,
}: {
  title?: ReactNode;
  count?: number;
  countAccent?: boolean;
  action?: ReactNode;
  flush?: boolean;
  as?: "section" | "div" | "article" | "aside";
  /** Fade up on entry (motion contract `data-reveal`); put a `data-reveal-group` on the page. */
  reveal?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Tag className={cn("panel", flush && "flush", className)} data-reveal={reveal ? "" : undefined}>
      {title || action ? (
        <div className="ph">
          {title ? (
            <h3>
              {title}
              {count !== undefined ? <span className={cn("badge num", countAccent && "accent")} data-count>
                  {count}
                </span> : null}
            </h3>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      {children}
    </Tag>
  );
}
