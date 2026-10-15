import { PageShell } from "@/components/layout/PageShell";
import { PRIVACY_CONTACT_EMAIL } from "@/lib/site";

type Section = { title: string; paragraphs?: string[]; items?: string[] };

const sections: Section[] = [
  {
    title: "Wie is verantwoordelijk?",
    paragraphs: [
      `IN-IT (Iraqi Network of Information Technology) beheert deze ledenomgeving en is verantwoordelijk voor de persoonsgegevens die hierin worden verwerkt. Heb je een privacyvraag of verzoek? Mail dan naar ${PRIVACY_CONTACT_EMAIL}.`,
    ],
  },
  {
    title: "Welke gegevens verzamelen we?",
    items: [
      "Inloggegevens van LinkedIn: je naam, e-mailadres, profielfoto en een accountidentificatie. We importeren geen connecties, werkgeschiedenis of profielen van anderen.",
      "Je toegangsaanvraag: je naam, e-mailadres, eventueel telefoonnummer, LinkedIn-profiel, motivatie en wie je heeft voorgedragen.",
      "Het profiel dat je zelf invult, zoals je omschrijving, functie, werkgever, woonplaats, vaardigheden, talen, wat je kunt bijdragen en wat je zoekt. Ook een profielfoto of cv dat je zelf uploadt wordt opgeslagen.",
      "Je activiteit in de ledenomgeving: de groepen waar je lid van wordt, berichten die je schrijft en bijeenkomsten waarvoor je je aanmeldt.",
    ],
  },
  {
    title: "Waarvoor gebruiken we je gegevens?",
    items: [
      "Voor je lidmaatschap: toegangsaanvragen beoordelen, inloggen mogelijk maken en de besloten ledenomgeving beheren. Dit is nodig om het aangevraagde lidmaatschap aan te bieden.",
      "Om je profiel aan andere leden te tonen. Dit gebeurt nadat je toestemming hebt gegeven en een beheerder je profiel heeft goedgekeurd. Je kunt deze toestemming intrekken door je profiel te laten verbergen.",
      "Om berichten over je lidmaatschap te sturen, zoals je activeringscode en nieuwe activiteiten. Activiteitenmails kun je uitschakelen in je profielinstellingen.",
    ],
  },
  {
    title: "Wie kan je profiel en cv zien?",
    paragraphs: [
      "Goedgekeurde leden zien je profiel nadat je toestemming hebt gegeven en een beheerder het heeft goedgekeurd. Bezoekers zonder account zien je profiel alleen als je zelf openbare velden hebt geselecteerd. Dan zijn je naam en uitsluitend die gekozen velden zichtbaar in het openbare ledenoverzicht en op je openbare profielpagina.",
      "Je cv is niet openbaar. Alleen jij en bevoegde beheerders kunnen het downloaden. Je kunt je cv in je profielinstellingen vervangen of verwijderen.",
    ],
  },
  {
    title: "Welke diensten gebruiken we?",
    paragraphs: [
      "We delen gegevens alleen met de diensten die nodig zijn om de ledenomgeving te laten werken, op basis van verwerkersovereenkomsten:",
    ],
    items: [
      "Vercel: host de website en slaat geüploade profielfoto’s en groepsafbeeldingen op. Cv’s worden in een afzonderlijke, afgeschermde opslag bewaard.",
      "Neon: beheert de ledendatabase. De servers bevinden zich in de Verenigde Staten.",
      "LinkedIn: verzorgt het inloggen. Voor je LinkedIn-account geldt het privacybeleid van LinkedIn.",
      "Resend: bezorgt onze e-mails.",
    ],
  },
  {
    title: "Gegevens buiten de Europese Unie",
    paragraphs: [
      "Sommige diensten slaan gegevens buiten de EU op of verwerken deze daar, onder meer in de Verenigde Staten. Bij zulke doorgiften gelden de waarborgen uit hun verwerkersovereenkomsten, zoals de Europese standaardcontractbepalingen.",
    ],
  },
  {
    title: "Hoe lang bewaren we je gegevens?",
    paragraphs: [
      "We bewaren je profiel zolang je lid bent. Als je je account verwijdert, worden je profiel, LinkedIn-koppeling, geüploade foto’s en cv verwijderd. Geschreven berichten blijven zichtbaar met de aanduiding van een verwijderd lid. Toegangsaanvragen bewaren we alleen zolang dat nodig is voor de afhandeling. Je kunt altijd vragen om je aanvraag te verwijderen.",
    ],
  },
  {
    title: "Je rechten",
    items: [
      "Je gegevens inzien en downloaden: gebruik de downloadoptie in je profielinstellingen.",
      "Je gegevens corrigeren: pas je profiel op elk moment aan.",
      "Je account verwijderen: gebruik de verwijderoptie in je profielinstellingen of mail ons.",
      "Toestemming intrekken of bezwaar maken: laat je profiel verbergen of mail ons. Je openbare velden en je cv kun je zelf beheren.",
      "Een klacht indienen: je kunt terecht bij de Autoriteit Persoonsgegevens.",
    ],
  },
  {
    title: "Cookies",
    paragraphs: [
      "We gebruiken alleen cookies die nodig zijn voor de werking van de ledenomgeving: om je ingelogd te houden en om je uitnodigingscode tijdens het inloggen te onthouden. We gebruiken geen tracking- of advertentiecookies.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Privacy"
      title="Privacyverklaring van IN-IT"
      description="Zo gaan we binnen IN-IT om met je persoonsgegevens."
    >
      <div className="max-w-4xl rounded-[2rem] border border-charcoal/10 bg-white/76 p-8 shadow-sm">
        <p className="text-sm font-semibold text-charcoal/55">Laatst bijgewerkt: 15 oktober 2026</p>
        <div className="mt-8 grid gap-7">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-black text-charcoal">{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-2 leading-7 text-charcoal/68">
                  {paragraph}
                </p>
              ))}
              {section.items ? (
                <ul className="mt-2 grid list-disc gap-1.5 pl-5 leading-7 text-charcoal/68">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
