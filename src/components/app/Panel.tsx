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
  className,
  children,
}: {
  title?: ReactNode;
  count?: number;
  countAccent?: boolean;
  action?: ReactNode;
  flush?: boolean;
  as?: "section" | "div" | "article" | "aside";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Tag className={cn("panel", flush && "flush", className)}>
      {title || action ? (
        <div className="ph">
          {title ? (
            <h3>
              {title}
              {count !== undefined ? <span className={cn("badge num", countAccent && "accent")}>{count}</span> : null}
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
