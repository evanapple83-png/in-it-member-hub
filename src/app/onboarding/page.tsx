import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { PageShell } from "@/components/layout/PageShell";
import { authOptions } from "@/lib/auth";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/join?locked=onboarding");

  return (
    <PageShell
      eyebrow="Onboarding"
      title="Review, enrich and submit your member profile"
      description="Your information will only be used to create your IN-IT community profile. Your profile becomes visible only after you submit it with consent and an admin approves it."
    >
      <OnboardingForm />
    </PageShell>
  );
}
