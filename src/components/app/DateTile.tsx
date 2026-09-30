import { cn } from "@/lib/utils";

const DAY = new Intl.DateTimeFormat("nl-NL", { day: "numeric", timeZone: "Europe/Amsterdam" });
const MONTH = new Intl.DateTimeFormat("nl-NL", { month: "short", timeZone: "Europe/Amsterdam" });

// Day number over short month (`.date`), in Dutch, Amsterdam time. `small` is the 34px cmdk size.
export function DateTile({
  date,
  accent = false,
  small = false,
  className,
}: {
  date: Date | string;
  accent?: boolean;
  small?: boolean;
  className?: string;
}) {
  const value = typeof date === "string" ? new Date(date) : date;
  const month = MONTH.format(value).replace(".", "");
  return (
    <span
      className={cn("date", accent && "accent", className)}
      style={small ? { width: 34, height: 34, borderRadius: 10 } : undefined}
      aria-label={`${DAY.format(value)} ${month}`}
    >
      <b className="num" style={small ? { fontSize: 13 } : undefined}>
        {DAY.format(value)}
      </b>
      {small ? null : <small>{month}</small>}
    </span>
  );
}
