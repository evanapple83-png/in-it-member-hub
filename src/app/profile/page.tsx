import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { PrivacyControls } from "@/components/profile/PrivacyControls";
import { getCurrentMember } from "@/lib/access";
import { authOptions } from "@/lib/auth";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/join?locked=profile");

  const member = await getCurrentMember();

  return (
    <PageShell
      eyebrow="Profile settings"
      title="Manage your IN-IT profile"
      description="Update your profile details, LinkedIn connection state and consent settings. Saved changes remain protected by the visibility workflow."
    >
      <OnboardingForm />
      {member ? <PrivacyControls initialEmailOptOut={member.email_opt_out} /> : null}
    </PageShell>
  );
}
