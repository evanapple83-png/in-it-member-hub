import { PageShell } from "@/components/layout/PageShell";

const sections = [
  {
    title: "What we collect",
    body: "IN-IT Member Hub uses LinkedIn sign-in only to authenticate you and prefill basic profile details returned by LinkedIn OpenID Connect, such as your name, email address, profile image and LinkedIn subject identifier. Members can manually add professional profile information during onboarding.",
  },
  {
    title: "How we use your information",
    body: "Your information is used to create and manage your IN-IT community profile, support admin approval, protect invite-only access and help approved members discover expertise inside the private member hub.",
  },
  {
    title: "Visibility and consent",
    body: "No member profile is visible in the directory unless the member has submitted the profile with consent and an IN-IT admin has approved it. Pending, hidden, rejected and non-consented profiles are not shown publicly.",
  },
  {
    title: "LinkedIn data",
    body: "LinkedIn is not scraped. IN-IT does not import LinkedIn connections, work history, education, skills or third-party profiles. LinkedIn is used only for sign-in and basic profile prefill for the authenticated user.",
  },
  {
    title: "Storage",
    body: "Profile and account data is stored in the IN-IT Member Hub database. Uploaded profile photos may be stored with the configured file storage provider. Access is limited to the application and authorized administrators.",
  },
  {
    title: "Contact",
    body: "For privacy questions or profile removal requests, contact the IN-IT community team through the official community channels.",
  },
];

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Privacy"
      title="IN-IT Member Hub Privacy Policy"
      description="A concise privacy policy for the invite-only IN-IT community platform."
    >
      <div className="max-w-4xl rounded-[2rem] border border-charcoal/10 bg-white/76 p-8 shadow-sm">
        <p className="text-sm font-semibold text-charcoal/55">Last updated: May 19, 2026</p>
        <div className="mt-8 grid gap-7">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-black text-charcoal">{section.title}</h2>
              <p className="mt-2 leading-7 text-charcoal/68">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
