import { z } from "zod";

const optionalText = z.string().nullable().optional();
const optionalNumber = z.number().nullable().optional();
export const vacancySchema = z.object({
  id: z.string(), title: z.string(), display_title: optionalText,
  external_url: optionalText, sector: optionalText, subsector: optionalText,
  rate_type: optionalText, rate_min: optionalNumber, rate_max: optionalNumber,
  hours_per_week_min: optionalNumber, hours_per_week_max: optionalNumber,
  duration_text: optionalText, city: optionalText, province: optionalText,
  remote_policy: optionalText, client_name: optionalText, broker_company: optionalText,
  summary: optionalText, description: optionalText, status: optionalText,
  closing_date: optionalText, start_date: optionalText,
  required_skills: z.array(z.string()).nullish(),
  extracted_requirements: z.array(z.string()).nullish(),
});
const vacanciesSchema = z.object({
  items: z.array(vacancySchema), total: z.number().int().nonnegative(),
  page: z.number().int().positive(), per_page: z.number().int().positive(),
  total_pages: z.number().int().nonnegative(),
});
const ratesSchema = z.object({
  subsectors: z.record(z.string(), z.object({ avg: z.number(), p25: z.number(), p75: z.number(), n: z.number() })),
  benchmarks: z.array(z.object({ roleKey: z.string(), label: z.string(), sector: z.string(), min: z.number(), median: z.number(), max: z.number(), source: z.string() })),
});
export type Vacancy = z.infer<typeof vacancySchema>;

export function parsePage(value: string | string[] | undefined) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : 1;
}

async function request(path: string, revalidate?: number) {
  const response = await fetch(`https://zzpdock.nl/api/v1/${path}`, {
    ...(revalidate ? { next: { revalidate } } : { cache: "no-store" as const }), signal: AbortSignal.timeout(15000), headers: { Accept: "application/json" },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`ZZPDock request failed: ${response.status}`);
  return response.json();
}
export async function getVacancies(page: number, filters: { q?: string; sector?: string; province?: string } = {}) {
  const params = new URLSearchParams({ page: String(page), per_page: "25" });
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  return vacanciesSchema.parse(await request(`vacancies?${params}`));
}
// Cache only public API data; profile matching happens separately for each request.
export async function getAllVacancies(filters: { q?: string; sector?: string; province?: string } = {}) {
  const load = async (page: number) => {
    const params = new URLSearchParams({ page: String(page), per_page: "100" });
    for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
    return vacanciesSchema.parse(await request(`vacancies?${params}`, 300));
  };
  const first = await load(1);
  const items = [...first.items];
  // Bound concurrent calls and fail the whole ranking if a page cannot be loaded.
  for (let page = 2; page <= first.total_pages; page += 4) {
    const pages = await Promise.all(Array.from({ length: Math.min(4, first.total_pages - page + 1) }, (_, i) => load(page + i)));
    for (const result of pages) items.push(...result.items);
  }
  return [...new Map(items.map(item => [item.id, item])).values()];
}
export async function getMarketRates() {
  return ratesSchema.parse(await request("market-rates"));
}
export async function getVacancy(id: string) {
  const data = await request(`vacancies/${encodeURIComponent(id)}`);
  return data === null ? null : vacancySchema.parse(data);
}
export function safeExternalUrl(value: string | null | undefined) {
  if (!value) return undefined;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
}
export function range(min: number | null | undefined, max: number | null | undefined, unit: string) {
  const format = (n: number) => n.toLocaleString("nl-NL");
  if (min != null && max != null) return `${format(min)}${min === max ? "" : `–${format(max)}`} ${unit}`;
  if (min != null) return `Vanaf ${format(min)} ${unit}`;
  if (max != null) return `Tot ${format(max)} ${unit}`;
  return "Niet vermeld";
}
