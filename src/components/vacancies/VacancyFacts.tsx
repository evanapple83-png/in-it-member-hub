import { range, type Vacancy } from "@/lib/zzpdock";

export function VacancyFacts({ vacancy: v }: { vacancy: Vacancy }) {
  const facts = [
    ["Opdrachtgever", v.client_name], ["Locatie", [v.city, v.province].filter(Boolean).join(", ")],
    ["Tarief", range(v.rate_min, v.rate_max, v.rate_type === "per_uur" ? "€/uur" : v.rate_type ?? "€")],
    ["Uren", range(v.hours_per_week_min, v.hours_per_week_max, "uur/week")],
    ["Looptijd", v.duration_text], ["Sector", v.subsector ?? v.sector],
    ["Werkwijze", v.remote_policy], ["Intermediair", v.broker_company],
    ["Sluitingsdatum", v.closing_date], ["Startdatum", v.start_date], ["Status", v.status],
  ];
  return <dl className="vacancy-facts">{facts.filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
