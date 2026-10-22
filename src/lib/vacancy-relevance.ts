type Profile = { skills: string[]; role?: string | null; headline?: string | null; canHelpWith?: string[] };
type MatchableVacancy = { title: string; display_title?: string | null; summary?: string | null; description?: string | null; sector?: string | null; subsector?: string | null; required_skills?: string[] | null; extracted_requirements?: string[] | null };
const stopWords = new Set("de het een en of voor van met in op aan bij als ik je jij wij we mijn jouw onze the a an and or for with at of to senior junior medior freelance zzp professional ervaren ervaring specialist expert consultant manager lead".split(" "));
const normalize = (text: string) => text.normalize("NFKC").toLocaleLowerCase("nl-NL").replace(/\s+/g, " ").trim();
function terms(profile: Profile) {
  const skills = [...new Set([...profile.skills, ...(profile.canHelpWith ?? [])].map(normalize).filter(Boolean))];
  const role = [...new Set(normalize(`${profile.role ?? ""} ${profile.headline ?? ""}`).split(/[^\p{L}\p{N}+#.]+/u).filter(t => t.length > 1 && !stopWords.has(t)))];
  return { skills, role: role.filter(t => !skills.includes(t)) };
}
function contains(text: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}+#])`, "u").test(text);
}
export function hasRelevanceProfile(profile: Profile) {
  const { skills, role } = terms(profile);
  return skills.length + role.length > 0;
}
export function vacancyRelevance(v: MatchableVacancy, profile: Profile) {
  const { skills, role } = terms(profile);
  const title = normalize(`${v.title} ${v.display_title ?? ""}`);
  const requirements = normalize([...(v.required_skills ?? []), ...(v.extracted_requirements ?? [])].join(" "));
  const body = normalize(`${v.summary ?? ""} ${v.description ?? ""} ${v.sector ?? ""} ${v.subsector ?? ""}`);
  let score = 0;
  const matches: string[] = [];
  for (const [list, weight] of [[skills, 3], [role, 1]] as const) {
    for (const term of list) {
      const points = contains(title, term) ? 6 : contains(requirements, term) ? 5 : contains(body, term) ? 2 : 0;
      if (points) { score += points * weight; matches.push(term); }
    }
  }
  return { score, matches: matches.slice(0, 3) };
}
export function rankVacancies<T extends MatchableVacancy>(vacancies: T[], profile: Profile) {
  return vacancies.map((vacancy, index) => ({ vacancy, index, ...vacancyRelevance(vacancy, profile) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
}
