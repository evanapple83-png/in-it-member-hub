export const provinces = ["Drenthe", "Flevoland", "Friesland", "Gelderland", "Groningen", "Limburg", "Noord-Brabant", "Noord-Holland", "Overijssel", "Utrecht", "Zeeland", "Zuid-Holland"];
export const sectors = ["ICT", "Fysiek domein", "Management & Organisatie", "Financiën", "Sociaal domein", "Juridisch", "Techniek & Engineering", "Inkoop", "Duurzaamheid", "Communicatie", "HRM", "Facilitair", "Officemanagement"];
export type VacancyFilters = { q: string; sector: string; province: string };
export function parseFilters(params: Record<string, string | string[] | undefined>): VacancyFilters {
  const text = (key: string) => typeof params[key] === "string" ? params[key].trim().slice(0, 150) : "";
  const sector = text("sector"), province = text("province");
  return { q: text("q"), sector: sectors.includes(sector) ? sector : "", province: provinces.includes(province) ? province : "" };
}
export function vacanciesHref(filters: VacancyFilters, page = 1, sort: "default" | "relevance" = "default") {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  if (sort === "relevance") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  return `/vacatures${params.size ? `?${params}` : ""}`;
}
