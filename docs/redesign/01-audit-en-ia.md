# IN-IT ledenomgeving: audit en informatiearchitectuur

Fase 1 en 2 van de redesign van alles achter de login. Stand 30 sep 2026, op basis van de code op `e200a05` en de productiedata. Niet visueel bekeken: inloggen gaat alleen via LinkedIn, dus deze audit leest de schermen uit de code.

## Wat er nu echt is

| Route | Wat het doet | Data vandaag |
|---|---|---|
| `/` | Marketingpagina; ingelogd komen er twee ledensecties onder de hero | 2 leden |
| `/members`, `/members/[id]` | Ledengids met filters, profielpagina | 2 leden |
| `/communities`, `/communities/[slug]` | Groepen met lidmaatschap en platte berichten | 3 communities |
| `/agenda`, `/agenda/[slug]` | Activiteiten met aanmelden en ICS | 6 voorbeeld-activiteiten |
| `/blog` | Verhalen, "Showcase van de week" | onbekend, waarschijnlijk 0 |
| `/profile` | Het onboardingformulier opnieuw, plus privacy | n.v.t. |
| `/admin/*` | Aanvragen, leden, invites, communities, activiteiten, import | n.v.t. |

Bestaat **niet** in de backend: berichten, notificaties, opgeslagen items, reacties, antwoorden in draadjes, zoeken over alles heen, peilingen, media in berichten.

## Fase 1: audit

### Kapot
1. **Mobiel heeft geen navigatie.** De menuknop in `Navbar.tsx:86` heeft geen handler; de navbar is een servercomponent. Een ingelogd lid op zijn telefoon kan alleen via de footer rondlopen. Dit is een bug, geen smaak, en moet los van de redesign gefixt worden.

### Navigatie
2. **Er is geen thuisbasis na het inloggen.** `/` blijft de marketingpagina met de grote hero; ingelogd krijg je daar twee ledenblokken onder. Niets beantwoordt "wat is er gaande".
3. **Product en brochure door elkaar.** Het menu mengt productplekken (Members, Agenda, Communities) met informatiepagina's (About, Contact) op gelijke hoogte: zes items plus Admin.
4. **Dubbele ingangen.** "Explore" rechtsboven gaat naar `/members`, dat al in het menu staat. "Profile" gaat naar een instellingenformulier, niet naar je profiel.
5. **Zwevende glaspillen.** Drie losse pillen met blur en schaduw. Oogt als marketing, schaalt niet naar een app met meer secties, en de actieve pagina wordt nergens aangegeven.

### Taal en termen
6. **Twee talen door elkaar.** "Members", "Profile settings", "Back to members", "Open space" naast "Agenda", "Word lid", "Deel jouw verhaal". Per scherm wisselt het.
7. **Drie woorden voor iets plaatsen.** Blog (verhalen), communityberichten en showcase zijn drie aparte plekken zonder uitleg waar wat hoort.
8. **Systeemtaal in de copy.** "Public results only include profiles with consent and admin approval", "protected by the visibility workflow". Dat is hoe het model werkt, niet wat het lid eraan heeft.

### Hiërarchie en layout
9. **Elke pagina is een landingspagina.** `PageShell` zet overal eyebrow + grote kop + intro met 160px ruimte erboven. De eigenlijke inhoud begint pas halverwege het scherm; op een laptop zie je bij Agenda de eerste activiteit amper.
10. **Alles is even zwaar.** 69 keer `font-black`. Als alles vet is, springt niets eruit.
11. **Gelijke kaarten overal.** Communities in twee gelijke kolommen, blog in twee gelijke kolommen, activiteiten als gelijke rijen. Geen schaalverschil, dus geen "kijk hier eerst".
12. **Geen beeld achter de login.** De publieke kant leunt op sterk beeld; binnen is het tekst op crème. Communities hebben alleen een icoon dat op slug hardgecodeerd is.
13. **Decoratieve verlopen.** Avatars zonder foto, de showcase-kaart en de profielbalk gebruiken blauw-naar-bordeaux verlopen. Samen met het glas geeft dat de "sjabloon"-indruk.

### Sociaal vs administratief
14. **Profiel is een formulier.** `/profile` hergebruikt het onboardingformulier. Je eigen profiel zoals anderen het zien, zit nergens in de navigatie.
15. **Community is een invoerveld met een lijst.** De lid-worden-knop staat in een eigen kaart bovenaan; berichten hebben geen reacties of antwoorden, dus een gesprek kan niet ontstaan.
16. **Agenda is een lijst.** Volledige datumzin als label, geen beeld, niet zichtbaar wie er komt, afgelopen items in dezelfde stroom.

### Wat goed is en blijft
- Het merk: diepblauw, bordeaux, goud en zand is eigen en warm. Dat gaat mee, alleen rustiger toegepast.
- Het logo en de heldenfoto van de publieke kant.
- De onderliggende functies werken: RSVP met ICS, lidmaatschap, moderatie, privacy per veld.

## De eerlijke kanttekening bij de brief

De brief vraagt om een platform dat "levend" voelt: wie is actief, trending gesprekken, berichten, notificaties. **Vandaag zijn er 2 leden, 3 communities en 6 voorbeeld-activiteiten.** Een homepage met "trending" en "actieve leden" staat bij deze schaal leeg, en een leeg sociaal scherm voelt dooier dan een rustig scherm.

Daarom ontwerp ik voor **twee toestanden**: de stille community van nu (weinig leden, weinig activiteit, sterke redactie door de beheerders) en de volle van later. Elk blok op de homepage krijgt een drempel: pas boven X items verschijnt het, daaronder neemt redactionele inhoud de plek over.

Berichten, notificaties, opgeslagen items en reacties zijn **nieuwe functies met een eigen datamodel**, geen redesign. Die zet ik in de IA als fase-2-plekken, maar ik bouw ze pas als jullie dat besluiten.

## Fase 2: informatiearchitectuur

### Taal: Nederlands (aanname)
De FRD en alle recente functies zijn Nederlands. Alles achter de login wordt Nederlands, met één woordenlijst:

| Nu | Wordt |
|---|---|
| Members / Member directory | Leden |
| Communities / Open space | Groepen |
| Agenda / Activiteiten | Agenda |
| Blog / Showcase | Verhalen |
| Community post | Bericht (in een groep) |
| Profile / Profile settings | Mijn profiel / Instellingen |

### Navigatie

**Desktop: linkerbalk, 240px, vast.**

```
[IN-IT logo]

  Vandaag          ← nieuwe thuisbasis
  Leden
  Groepen
  Agenda
  Verhalen

  ── mijn groepen ──
  • Security Specialists
  • Engineers

[⌘K Zoeken]

[avatar] Evan Poul        ← menu: Mijn profiel, Instellingen,
                             Over IN-IT, Contact, Uitloggen
  Beheer                   ← alleen voor beheerders
```

- Vijf hoofdplekken, niet meer. Over en Contact verhuizen naar het accountmenu en de footer van de publieke site.
- "Mijn groepen" in de balk zoals de referentie "Following" toont: snelle toegang tot waar je lid van bent. Verschijnt alleen als je lid bent van minstens één groep.
- De actieve indicator glijdt tussen items (emil: 200ms ease-out, alleen transform).
- Bovenin de content geen aparte zoekbalk; zoeken zit onder ⌘K en de knop in de balk.

**Mobiel: onderbalk met vier tabs plus avatar.**

```
┌──────────────────────────────┐
│ IN-IT            [zoek] [avatar] │  ← compacte kop
│                              │
│         inhoud               │
│                              │
├──────────────────────────────┤
│ Vandaag  Leden  Groepen  Agenda │
└──────────────────────────────┘
```

- Verhalen zit op mobiel onder Vandaag (uitgelicht verhaal) en via de avatar. Vier tabs is het maximum voor een duimbereik.
- Avatar rechtsboven opent een bottom sheet met profiel, instellingen, verhalen, over, uitloggen.

### Het publieke en private deel scheiden
- Ingelogd: `/` stuurt door naar `/vandaag`. De marketingpagina blijft voor niet-leden.
- De publieke site houdt de huidige zwevende navigatie; de app krijgt de linkerbalk. Zo voelt binnenkomen als ergens binnenkomen.

### De reizen die tellen

1. **Eerste keer binnen.** Vandaag toont een welkomstblok met drie stappen (profiel afmaken, een groep kiezen, je aanmelden voor een activiteit). Verdwijnt als alle drie gedaan zijn.
2. **Terugkomen.** Vandaag beantwoordt in één scherm: wat komt eraan (volgende activiteit), wat is nieuw (berichten in jouw groepen, nieuw verhaal), wie is nieuw (nieuwe leden).
3. **Iemand zoeken met kennis.** ⌘K of Leden, zoeken op vaardigheid, direct naar het profiel, verbinden via LinkedIn.
4. **Meedoen.** Vanuit elke groepskaart één klik naar het gesprek; plaatsen staat bovenaan in de groep.
5. **Beheren.** Beheerders houden hun eigen omgeving; de redesign raakt `/admin` pas later.

### Vandaag: blokken en drempels

| Blok | Toont | Verschijnt als |
|---|---|---|
| Welkom + eerste stappen | Naam, 3 stappen | onboarding niet af |
| Uitgelicht | Showcase-verhaal groot met beeld, anders de eerstvolgende activiteit | altijd (een van beide) |
| Binnenkort | Volgende 3 activiteiten met datumblok en wie er komen | ≥1 komende activiteit |
| Uit jouw groepen | Laatste berichten uit groepen waar je lid van bent | ≥1 bericht in 30 dagen |
| Nieuwe leden | Gezichten en rol | ≥2 nieuwe leden in 30 dagen |
| Groepen om te ontdekken | Groepen waar je nog geen lid van bent | ≥1 zo'n groep |

Bij de huidige data verschijnen: welkom, uitgelicht, binnenkort, groepen om te ontdekken. Dat is een vol en eerlijk scherm.

### Plekken voor later (nieuwe functies, apart besluiten)
- **Reacties en antwoorden** in groepsberichten. Het meeste effect op "levend": zonder antwoorden kan er geen gesprek ontstaan.
- **Opgeslagen** (verhalen en activiteiten bewaren).
- **Notificaties** (antwoord op jouw bericht, nieuwe activiteit in jouw groep).
- **Berichten** (1-op-1). Het duurst en met de meeste moderatie-impact; bij deze schaal doet LinkedIn het al.

## Designrichting (voor fase 3)
- **Director: `minimalist-ui`.** De referentie is een rustige app met zachte ronde kaarten, veel wit, één accentkleur en grote beelden. Dat is precies minimalist; de andere drie directors blijven stil.
- **Tokens:** crème achtergrond blijft, kaarten wit zonder blur, radius 16px op kaarten en 999px op knoppen en chips, schaduw bijna nul. Accent: bordeaux (`#6f2637`) voor acties en de badge; diepblauw voor tekstlinks; goud alleen als detail.
- **Typografie:** Geist blijft voor UI, gewichten 400/500/600; koppen krijgen schaalverschil in plaats van `font-black`. Voor uitgelichte koppen een serif (bijv. Fraunces) als tweede stem.
- **Beeld:** elke groep krijgt een eigen omslagbeeld (door de beheerder te uploaden, Blob-store staat al), activiteiten optioneel ook. Zonder beeld een rustig vlak in groepskleur, geen verloop.
- **Beweging:** kaarten bij hover 2px omhoog en beeld schaal 1.03; de navindicator glijdt; ⌘K schaalt van 0.97 met opacity in 150ms. Alles met een reduced-motion-variant.

## Voorgestelde volgorde
1. **Nu, los:** mobiele navigatie repareren (bug).
2. **Fase 3:** wireframes als klikbare pagina voor Vandaag, Groep, Agenda, Profiel en ⌘K, op desktop en mobiel.
3. **Fase 4:** app-schil bouwen (linkerbalk, onderbalk, `/vandaag`, taal gelijktrekken), daarna scherm voor scherm.
4. **Later, apart besluit:** reacties en antwoorden, dan opgeslagen en notificaties.
