import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { requireApprovedAccess } from "@/lib/access-state";
import { getAllVacancies, getMarketRates, getVacancies, parsePage, range } from "@/lib/zzpdock";
import { parseFilters, provinces, sectors, vacanciesHref } from "@/lib/vacancy-filters";
import { hasRelevanceProfile, rankVacancies, vacancyRelevance } from "@/lib/vacancy-relevance";
import "./vacancies.css";

export const metadata = { title: "Vacatures & markttarieven | IN-IT" };

export default async function VacanciesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { member } = await requireApprovedAccess("/vacatures");
  const params = await searchParams;
  const page = parsePage(params.page);
  const filters = parseFilters(params);
  const canRank = hasRelevanceProfile(member);
  const sort = params.sort === "relevance" && canRank ? "relevance" : "default";
  const loadVacancies = async () => {
    if (sort !== "relevance") return getVacancies(page, filters);
    const ranked = rankVacancies(await getAllVacancies(filters), member);
    const totalPages = Math.max(1, Math.ceil(ranked.length / 25));
    const currentPage = Math.min(page, totalPages);
    return { items: ranked.slice((currentPage - 1) * 25, currentPage * 25).map(r => r.vacancy), total: ranked.length, page: currentPage, per_page: 25, total_pages: totalPages };
  };
  const activeFilters = Object.entries(filters).filter(([, value]) => value);
  const [vacancies, rates] = await Promise.allSettled([loadVacancies(), getMarketRates()]);
  const data = vacancies.status === "fulfilled" ? vacancies.value : null;
  const market = rates.status === "fulfilled" ? rates.value : null;
  const href = (page = 1) => vacanciesHref(filters, page, sort);
  return <div className="page vacancies-page">
    <header className="hello"><div><span className="vacancy-eyebrow">Jouw volgende stap</span><h1>Vind een opdracht die bij je past</h1><p>Actuele vacatures, helder overzicht. Ontdek jouw mogelijkheden.</p></div></header>
    <section className="panel vacancy-filter-panel" aria-label="Vacatures filteren">
      <form action="/vacatures" method="get" className="vacancy-filters">
        {sort === "relevance" ? <input type="hidden" name="sort" value="relevance" /> : null}
        <label className="vacancy-search">Zoek een opdracht<div className="vacancy-input-wrap"><Icon name="search" /><input name="q" type="search" placeholder="Functie, vaardigheid of opdrachtgever" defaultValue={filters.q} maxLength={150} /></div></label>
        <label>Vakgebied<select name="sector" defaultValue={filters.sector}><option value="">Alle vakgebieden</option>{sectors.map(s => <option key={s}>{s}</option>)}</select></label>
        <label>Provincie<select name="province" defaultValue={filters.province}><option value="">Heel Nederland</option>{provinces.map(p => <option key={p}>{p}</option>)}</select></label>
        <button className="btn primary" type="submit">Zoeken <Icon name="arrow" /></button>
      </form>
      {activeFilters.length ? <div className="vacancy-active-filters"><span>Actieve filters</span>{activeFilters.map(([key, value]) => <Link key={key} className="vacancy-filter-chip" href={vacanciesHref({ ...filters, [key]: "" }, 1, sort)} aria-label={`Verwijder filter ${value}`}>{value}<Icon name="x" /></Link>)}<Link className="vacancy-reset" href={vacanciesHref({ q: "", sector: "", province: "" }, 1, sort)}>Wis alles</Link></div> : null}
    </section>
    <section aria-labelledby="vacancies-title">
      <div className="vacancy-results-heading"><h2 id="vacancies-title">{data ? <>{data.total.toLocaleString("nl-NL")} <span>{activeFilters.length ? "passende opdrachten" : "opdrachten"}</span></> : "Opdrachten"}</h2><span className="muted">Via ZZPDock</span></div>
      <div className="vacancy-sort-row">
        <div className="vacancy-sort-options" aria-label="Sorteer opdrachten">
          <Link className={`btn${sort === "default" ? " primary" : ""}`} href={vacanciesHref(filters)} aria-current={sort === "default" ? "true" : undefined}>Standaard</Link>
          {canRank ? <Link className={`btn${sort === "relevance" ? " primary" : ""}`} href={vacanciesHref(filters, 1, "relevance")} aria-current={sort === "relevance" ? "true" : undefined} prefetch={false}><Icon name="user" />Relevant voor mij</Link> : <Link className="btn" href="/profile"><Icon name="plus" />Vul je skills aan</Link>}
        </div>
        <p className="muted">{sort === "relevance" ? "Op basis van je skills, functie en headline. Sterkste overeenkomsten eerst." : canRank ? "Ontdek welke opdrachten aansluiten op jouw profiel." : "Voeg skills of een functie toe aan je profiel om persoonlijk te sorteren."}</p>
      </div>
      {!data ? <div className="panel vacancy-empty" role="alert"><Icon name="info" /><h3>Even geen verbinding</h3><p>We kunnen de opdrachten nu niet ophalen. Probeer het nog eens.</p><Link className="btn" href={href(page)}>Opnieuw laden</Link></div> : <>
        {!data.items.length ? <div className="panel vacancy-empty"><Icon name="search" /><h3>Geen opdrachten gevonden</h3><p>Probeer een andere zoekterm of verruim je filters.</p><Link className="btn" href={page > 1 ? href() : "/vacatures"}>{page > 1 ? "Terug naar de eerste pagina" : "Wis alle filters"}</Link></div> : <div className="vacancy-list">{data.items.map(v => <article key={v.id} className="panel vacancy-card">
          <div className="vacancy-card-main"><div className="vacancy-card-kicker">{v.subsector || v.sector || "Opdracht"}</div>
            <h3><Link href={`/vacatures/${encodeURIComponent(v.id)}`}>{v.display_title || v.title}</Link></h3>
            {sort === "relevance" ? <div className="vacancy-matches">{vacancyRelevance(v, member).matches.length ? <><span>Match met je profiel:</span>{vacancyRelevance(v, member).matches.map(term => <span className="vacancy-match" key={term}>{term}</span>)}</> : <span>Geen directe overeenkomst met je profiel</span>}</div> : null}
            {v.client_name ? <p className="vacancy-client">{v.client_name}</p> : null}
            <div className="vacancy-meta">{v.city || v.province ? <span><Icon name="pin" />{v.city || v.province}</span> : null}{v.hours_per_week_min != null || v.hours_per_week_max != null ? <span><Icon name="clock" />{range(v.hours_per_week_min, v.hours_per_week_max, "uur/week")}</span> : null}{v.duration_text ? <span><Icon name="cal" />{v.duration_text}</span> : null}</div>
            {v.summary ? <p className="vacancy-summary">{v.summary}</p> : null}
          </div><div className="vacancy-card-side"><div className="vacancy-rate">{v.rate_min != null || v.rate_max != null ? range(v.rate_min, v.rate_max, "€") : "Tarief op aanvraag"}<span>{v.rate_type === "per_uur" ? "per uur" : v.rate_type?.replaceAll("_", " ")}</span></div><Link className="btn" href={`/vacatures/${encodeURIComponent(v.id)}`} aria-label={`Bekijk opdracht: ${v.display_title || v.title}`}>Bekijk opdracht <Icon name="arrow" /></Link></div>
        </article>)}</div>}
        {data.total_pages > 1 ? <nav className="vacancy-pagination" aria-label="Vacaturepagina’s">
          {data.page > 1 ? <Link className="btn" href={href(Math.min(data.page - 1, Math.max(1, data.total_pages)))}>← Vorige</Link> : <span className="btn vacancy-disabled" aria-disabled="true">← Vorige</span>}
          <span>Pagina <strong>{data.page}</strong> van {data.total_pages}</span>
          {data.page < data.total_pages ? <Link className="btn" href={href(data.page + 1)}>Volgende →</Link> : <span className="btn vacancy-disabled" aria-disabled="true">Volgende →</span>}
        </nav> : null}
      </>}
    </section>
    <details className="panel vacancy-market"><summary><span><span className="vacancy-eyebrow">Weet wat je waard bent</span><span className="vacancy-market-title">Vergelijk markttarieven</span><span className="muted">Uurtarieven en benchmarks per vakgebied</span></span><Icon name="plus" /></summary>
      {!market ? <p role="alert">Markttarieven konden niet worden geladen. <Link href={href(page)}>Probeer opnieuw</Link>.</p> : <>
        <p className="muted">Uurtarieven in euro’s. De bandbreedte loopt van het 25e tot het 75e percentiel.</p>
        <div className="vacancy-table"><table><caption>Tarieven uit opdrachten</caption><thead><tr><th scope="col">Sector</th><th scope="col">Gemiddeld</th><th scope="col">Bandbreedte</th><th scope="col">Aantal</th></tr></thead><tbody>{Object.entries(market.subsectors).map(([name, r]) => <tr key={name}><th scope="row">{name}</th><td>€ {r.avg}</td><td>€ {r.p25}–{r.p75}</td><td>{r.n}</td></tr>)}</tbody></table></div>
        <details><summary>Bekijk benchmarks per functie</summary><div className="vacancy-table"><table><caption>Functietarieven in euro’s per uur</caption><thead><tr><th scope="col">Functie</th><th scope="col">Sector</th><th scope="col">Mediaan</th><th scope="col">Min–max</th><th scope="col">Bron</th></tr></thead><tbody>{market.benchmarks.map(r => <tr key={r.roleKey}><th scope="row">{r.label}</th><td>{r.sector}</td><td>€ {r.median}</td><td>€ {r.min}–{r.max}</td><td>{r.source}</td></tr>)}</tbody></table></div></details>
      </>}
    </details>
  </div>;
}
