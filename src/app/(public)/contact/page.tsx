import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { isApprovedMember } from "@/lib/access";
import { PRIVACY_CONTACT_EMAIL } from "@/lib/site";

export default async function ContactPage() {
  if (!(await isApprovedMember())) redirect("/join?locked=contact");

  return (
    <PageShell
      eyebrow="Contact"
      title="Een vraag, een idee voor samenwerking of een kans voor de community?"
      description="Mail het IN-IT-team en we nemen contact met je op."
    >
      <div className="max-w-2xl rounded-3xl border border-charcoal/10 bg-white/72 p-8 shadow-sm">
        <p className="leading-7 text-charcoal/68">
          Wil je een bijeenkomst organiseren, mentor worden, een sessie sponsoren of meebouwen aan de community? Mail het IN-IT-team en we brengen je in contact met de juiste vrijwilliger.
        </p>
        <Button asChild className="mt-6">
          <Link href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
            <Mail className="h-4 w-4" />
            Mail IN-IT
          </Link>
        </Button>
      </div>
    </PageShell>
  );
}
