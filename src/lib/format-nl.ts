// Dutch date/time wording for the member hub, always in Amsterdam time.

const TZ = "Europe/Amsterdam";
const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("nl-NL", { timeZone: TZ, ...options });

const WEEKDAY_DATE = fmt({ weekday: "long", day: "numeric", month: "long" });
const SHORT_DATE = fmt({ weekday: "short", day: "numeric", month: "short" });
const LONG_DATE = fmt({ day: "numeric", month: "long", year: "numeric" });
const TIME = fmt({ hour: "2-digit", minute: "2-digit" });
const HOUR = fmt({ hour: "numeric", hourCycle: "h23" });

const toDate = (value: Date | string) => (typeof value === "string" ? new Date(value) : value);

/** "woensdag 30 september" */
export function weekdayDate(value: Date | string = new Date()) {
  return WEEKDAY_DATE.format(toDate(value));
}

/** "wo 30 sep" */
export function shortDate(value: Date | string) {
  return SHORT_DATE.format(toDate(value)).replace(/\./g, "");
}

/** "30 september 2026" */
export function longDate(value: Date | string) {
  return LONG_DATE.format(toDate(value));
}

/** "19:30" */
export function time(value: Date | string) {
  return TIME.format(toDate(value));
}

/** "19:30 tot 21:00" or just "19:30" */
export function timeRange(start: string, end?: string | null) {
  return end ? `${time(start)} tot ${time(end)}` : time(start);
}

export function greeting(now: Date = new Date()) {
  const hour = Number(HOUR.format(now));
  if (hour < 6) return "Goedenacht";
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

/** "zojuist", "12 min geleden", "3 uur geleden", "gisteren", "4 dagen geleden", else a date */
export function relative(value: Date | string, now: number = Date.now()) {
  const diff = Math.max(0, now - toDate(value).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "zojuist";
  if (min < 60) return `${min} min geleden`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} uur geleden`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "gisteren";
  if (days < 7) return `${days} dagen geleden`;
  return longDate(value);
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/** Labels for the community categories stored in the database. */
export function groupCategory(category: string) {
  if (category === "social") return "Sociaal";
  if (category === "professional") return "Vakgroep";
  return capitalize(category);
}

/** Short plain preview of a longer text (same as `excerpt` in lib/blog, without the database import). */
export function excerpt(body: string, length = 220) {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length <= length ? flat : `${flat.slice(0, length).trimEnd()}…`;
}
