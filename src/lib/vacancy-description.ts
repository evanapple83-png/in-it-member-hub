export type DescriptionBlock = { type: "heading" | "paragraph"; text: string };

// Some providers flatten the entire advert, including its headings, into one line.
const headings = [
  "Wat maakt deze functie interessant?", "Wat ga je doen?", "Wat breng je mee?",
  "Wat neem je mee?", "Wat bieden wij?", "Wat bieden we jou?", "Wie ben jij?",
  "Jouw verantwoordelijkheden", "Jouw kwaliteiten", "Over de functie",
  "Over de opdracht", "Functieomschrijving", "Werkzaamheden", "Functie-eisen",
  "Arbeidsvoorwaarden", "Verantwoordelijkheden", "Eisen", "Wensen",
];
const headingPattern = new RegExp(`(?<![\\p{L}\\p{N}])(${headings.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\p{L}\\p{N}])`, "gu");

export function descriptionBlocks(description: string | null | undefined, summary?: string | null): DescriptionBlock[] {
  const text = description?.trim() || summary?.trim();
  if (!text) return [];
  const blocks: DescriptionBlock[] = [];
  const segmenter = new Intl.Segmenter("nl", { granularity: "sentence" });
  for (const part of text.replace(/\r\n?/g, "\n").split(headingPattern)) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (headings.includes(trimmed)) {
      blocks.push({ type: "heading", text: trimmed });
      continue;
    }
    for (const paragraph of trimmed.split(/\n\s*\n/)) {
      let chunk = "";
      for (const { segment } of segmenter.segment(paragraph)) {
        if (chunk && chunk.length + segment.length > 450) {
          blocks.push({ type: "paragraph", text: chunk.trim() });
          chunk = "";
        }
        chunk += segment;
      }
      if (chunk.trim()) blocks.push({ type: "paragraph", text: chunk.trim() });
    }
  }
  return blocks;
}
