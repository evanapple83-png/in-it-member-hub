import { descriptionBlocks } from "@/lib/vacancy-description";

export function VacancyDescription({ description, summary }: { description?: string | null; summary?: string | null }) {
  const blocks = descriptionBlocks(description, summary);
  if (!blocks.length) return <p className="muted">Geen omschrijving beschikbaar. Bekijk de opdracht bij de aanbieder voor meer informatie.</p>;
  return <div className="vacancy-description">{blocks.map((block, index) => block.type === "heading"
    ? <h3 key={index}>{block.text}</h3>
    : <p key={index}>{block.text}</p>)}</div>;
}
