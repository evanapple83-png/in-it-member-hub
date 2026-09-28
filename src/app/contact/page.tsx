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
      title="Bring a question, partnership idea or community opportunity"
      description="Email the IN-IT team and we will get back to you."
    >
      <div className="max-w-2xl rounded-3xl border border-charcoal/10 bg-white/72 p-8 shadow-sm">
        <p className="leading-7 text-charcoal/68">
          Want to host an event, offer mentorship, sponsor a session or help shape the hub? Reach the IN-IT team and we will route the
          conversation to the right volunteer.
        </p>
        <Button asChild className="mt-6">
          <Link href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
            <Mail className="h-4 w-4" />
            Email IN-IT
          </Link>
        </Button>
      </div>
    </PageShell>
  );
}
