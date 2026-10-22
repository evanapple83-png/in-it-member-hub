import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApprovedAccess } from "@/lib/access-state";
import { getVacancy, safeExternalUrl } from "@/lib/zzpdock";
import { VacancyFacts } from "@/components/vacancies/VacancyFacts";
import "../vacancies.css";

export const metadata = { title: "Vacature | IN-IT" };
export default async function VacancyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireApprovedAccess("/vacatures");
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const result = await getVacancy(id).then(value => ({ ok: true as const, value }), () => ({ ok: false as const }));
  if (!result.ok) return <div className="page"><section className="panel"><h1>Vacature niet beschikbaar</h1><p role="alert">De vacature kon niet worden geladen. Probeer het later opnieuw.</p><Link href={`/vacatures/${id}`}>Probeer opnieuw</Link><p><Link href="/vacatures">← Alle vacatures</Link></p></section></div>;
  const v = result.value;
  if (!v) notFound();
  const url = safeExternalUrl(v.external_url);
  return <div className="page vacancies-page"><Link href="/vacatures">← Alle vacatures</Link>
    <section className="panel"><h1>{v.display_title || v.title}</h1><VacancyFacts vacancy={v} />
      {url ? <a className="btn" href={url} target="_blank" rel="noopener noreferrer">Bekijk opdracht bij de aanbieder ↗</a> : null}
    </section>
    <article className="panel"><h2>Over de opdracht</h2><p className="vacancy-description">{v.description || v.summary || "Geen omschrijving beschikbaar. Bekijk de opdracht bij de aanbieder voor meer informatie."}</p>
      {v.required_skills?.length ? <><h3>Vaardigheden</h3><ul>{v.required_skills.map(skill => <li key={skill}>{skill}</li>)}</ul></> : null}
    </article><p className="muted">Bron: ZZPDock. Controleer de actuele voorwaarden bij de aanbieder.</p>
  </div>;
}
