// One-off showcase seed: vult de activiteitenagenda met mock-events (status published).
// Draaien: node --env-file=.env.local scripts/seed-events.mjs
// Idempotent: bestaande slugs worden overgeslagen.
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL (run with --env-file=.env.local)");
  process.exit(1);
}

const sql = neon(url);

const events = [
  {
    slug: "tech-talk-ai-agents-in-de-praktijk",
    title: "Tech Talk: AI-agents in de praktijk",
    description:
      "Twee leden laten zien hoe zij AI-agents inzetten in hun dagelijkse werk: van code-review tot klantenservice-automatisering. Met live demo's en ruimte voor vragen. Online via Google Meet, kort en praktisch.",
    location: "Online (Google Meet)",
    starts_at: "2026-06-16T19:30:00+02:00",
    ends_at: "2026-06-16T21:00:00+02:00",
    category: "kennis",
    meet_link: "https://meet.google.com/init-tech-talk",
  },
  {
    slug: "lunchwebinar-cloud-security-fundamentals",
    title: "Lunchwebinar: Cloud security fundamentals",
    description:
      "Compact lunchwebinar door onze security specialists: de vijf meest gemaakte fouten in Azure- en AWS-omgevingen, en hoe je ze voorkomt. Neem je eigen vragen mee.",
    location: "Online (Google Meet)",
    starts_at: "2026-06-18T12:00:00+02:00",
    ends_at: "2026-06-18T13:00:00+02:00",
    category: "kennis",
    meet_link: "https://meet.google.com/init-security",
  },
  {
    slug: "in-it-zomerborrel-netwerkavond",
    title: "IN-IT zomerborrel & netwerkavond",
    description:
      "De zomereditie van onze netwerkborrel: bijpraten met bekende gezichten, nieuwe leden verwelkomen en informeel kennis uitwisselen. Partners en voorgedragen vrienden van IN-IT zijn welkom. Eerste drankje van de community.",
    location: "Strandzuid, Amsterdam",
    starts_at: "2026-06-25T18:00:00+02:00",
    ends_at: "2026-06-25T21:30:00+02:00",
    category: "community",
  },
  {
    slug: "workshop-cv-linkedin-review-night",
    title: "Workshop: CV & LinkedIn review night",
    description:
      "Breng je CV of LinkedIn-profiel mee en krijg directe feedback van recruiters en senior leden uit het netwerk. In kleine groepen, dus iedereen komt aan bod. Aanmelden verplicht, beperkt aantal plekken.",
    location: "Seats2meet, Utrecht Centraal",
    starts_at: "2026-07-02T19:00:00+02:00",
    ends_at: "2026-07-02T21:00:00+02:00",
    category: "workshop",
  },
  {
    slug: "mentorship-programma-kick-off-q3",
    title: "Mentorship-programma: kick-off Q3",
    description:
      "Aftrap van de derde mentorship-ronde. We koppelen mentoren aan mentees, leggen het programma uit en delen ervaringen uit de vorige ronde. Ook interessant als je twijfelt of mentorschap iets voor je is.",
    location: "Online (Google Meet)",
    starts_at: "2026-07-09T19:00:00+02:00",
    ends_at: "2026-07-09T20:00:00+02:00",
    category: "community",
    meet_link: "https://meet.google.com/init-mentorship",
  },
  {
    slug: "voetbal-bbq-westerpark",
    title: "Voetbal & BBQ in het Westerpark",
    description:
      "De social zomerklassieker: een vriendschappelijk potje voetbal gevolgd door BBQ in het park. Familie is welkom, meedoen of aanmoedigen mag allebei. Bij regen verplaatsen we naar een latere datum.",
    location: "Westerpark, Amsterdam",
    starts_at: "2026-07-19T14:00:00+02:00",
    ends_at: "2026-07-19T18:00:00+02:00",
    category: "social",
  },
];

let inserted = 0;
for (const e of events) {
  const rows = await sql`
    insert into events (slug, title, description, location, starts_at, ends_at, category, meet_link, status, audience)
    values (${e.slug}, ${e.title}, ${e.description}, ${e.location}, ${e.starts_at}, ${e.ends_at}, ${e.category}, ${e.meet_link ?? null}, 'published', 'all')
    on conflict (slug) do nothing
    returning slug
  `;
  if (rows.length > 0) {
    inserted += 1;
    console.log(`+ ${e.title}`);
  } else {
    console.log(`= ${e.title} (bestond al, overgeslagen)`);
  }
}
console.log(`\nKlaar: ${inserted} van ${events.length} events toegevoegd.`);
