import { redirect } from "next/navigation";
import { AuthSplit } from "@/components/app/AuthSplit";
import { ProfileForm } from "@/components/access/ProfileForm";
import { getAccessState } from "@/lib/access-state";

export const metadata = { title: "Je profiel | IN-IT" };

const QUOTE = {
  title: "Iraqi Network of Information Technology",
  text: "Een besloten netwerk van IT-professionals met Iraakse roots in Nederland.",
};

// Anyone signed in may be here: new members finish step 2, waiting members adjust their
// application, approved members edit their profile (no stepper, back to /profile).
export default async function OnboardingPage() {
  const { state } = await getAccessState();
  if (state === "anon") redirect("/inloggen");
  const edit = state === "approved";
  return (
    <AuthSplit crop="c-arch" quote={QUOTE}>
      <ProfileForm mode={edit ? "edit" : "new"} returnTo={edit ? "/profile" : "/wachten"} />
    </AuthSplit>
  );
}
