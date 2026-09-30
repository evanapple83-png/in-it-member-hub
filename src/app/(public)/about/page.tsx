import { PageShell } from "@/components/layout/PageShell";

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About IN-IT"
      title="A warmer professional network for Iraqi tech talent in the Netherlands"
      description="IN-IT connects IT professionals with Iraqi roots who are active in the Netherlands. V0.2 turns the original proof of concept into a searchable, consent-first community hub."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {["Discover expertise", "Create mentorship paths", "Strengthen community trust"].map((title) => (
          <div key={title} className="rounded-3xl border border-charcoal/10 bg-white/72 p-6 shadow-sm">
            <h2 className="text-xl font-black text-charcoal">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-charcoal/65">
              Built around clear profiles, useful filters and approval workflows that respect every member visibility choice.
            </p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
