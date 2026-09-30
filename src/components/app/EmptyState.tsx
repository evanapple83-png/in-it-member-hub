import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

// Calm empty state: icon in a soft ring, optional title, one line of text, optional action.
export function EmptyState({
  icon = "check",
  title,
  text,
  action,
  compact = false,
  className,
}: {
  icon?: IconName;
  title?: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("empty", className)} style={compact ? { padding: "22px 12px" } : undefined}>
      <span className="halo">
        <Icon name={icon} />
      </span>
      {title ? <h4 style={{ fontSize: 16 }}>{title}</h4> : null}
      {text ? <p>{text}</p> : null}
      {action}
    </div>
  );
}
