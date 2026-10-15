import { PageShell } from "@/components/layout/PageShell";

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="Over IN-IT"
      title="Een betrokken netwerk voor Iraakse IT-professionals in Nederland"
      description="IN-IT verbindt IT-professionals met Iraakse roots in Nederland. Hier vind je vakgenoten, deel je kennis en bouw je aan een netwerk waarin je zelf bepaalt wat je deelt."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {["Ontdek expertise", "Vind begeleiding", "Bouw aan vertrouwen"].map((title) => (
          <div key={title} className="rounded-3xl border border-charcoal/10 bg-white/72 p-6 shadow-sm">
            <h2 className="text-xl font-black text-charcoal">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-charcoal/65">
              Duidelijke profielen, handige zoekfilters en zorgvuldig toegangsbeheer helpen je om vakgenoten te vinden. Ieder lid bepaalt zelf welke profielgegevens openbaar zijn.
            </p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
