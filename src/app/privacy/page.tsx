import { PageShell } from "@/components/layout/PageShell";
import { PRIVACY_CONTACT_EMAIL } from "@/lib/site";

type Section = { title: string; paragraphs?: string[]; items?: string[] };

const sections: Section[] = [
  {
    title: "Who is responsible",
    paragraphs: [
      `IN-IT (Iraqi Network of Information Technology) runs this member hub and is responsible for the personal data processed in it. For any privacy question or request, email ${PRIVACY_CONTACT_EMAIL}.`,
    ],
  },
  {
    title: "What we collect",
    items: [
      "Sign-in details from LinkedIn: your name, email address, profile picture and a LinkedIn account identifier. We do not import your connections, work history or anyone else's profile.",
      "Your access request: name, email address, phone number if you give it, LinkedIn profile link, your motivation and who proposed you.",
      "The profile you fill in yourself: for example your headline, role, company, location, skills, languages, what you can help with and what you are looking for, plus a profile photo if you upload one.",
      "What you do in the hub: the communities you join, posts you write and the events you sign up for.",
    ],
  },
  {
    title: "Why we use it",
    items: [
      "To run your membership: checking access requests, letting you sign in and keeping the hub invite-only. This is needed to provide the membership you asked for.",
      "To show your profile to other members. This only happens after you give consent and an admin approves your profile. You can take it back at any time by hiding your profile.",
      "To send you messages about your membership, such as your activation code and new events. You can turn off event emails on your profile page.",
    ],
  },
  {
    title: "Who can see your profile",
    paragraphs: [
      "Your profile appears in the member directory only after you consent and an admin approves it, and only other approved members can see the directory. Your public profile page shows only the fields you marked as public yourself. Everything else stays inside the hub.",
    ],
  },
  {
    title: "Services we rely on",
    paragraphs: [
      "We share data only with the services that keep the hub running, each under a data processing agreement:",
    ],
    items: [
      "Vercel: hosts the website and stores uploaded profile photos.",
      "Neon: stores the member database. Its servers are in the United States.",
      "LinkedIn: handles signing in. LinkedIn's own privacy policy applies to your LinkedIn account.",
      "Resend: delivers our emails.",
    ],
  },
  {
    title: "Data outside the European Union",
    paragraphs: [
      "Some of these services store or process data outside the EU, including in the United States. Where that happens, the transfer is covered by the safeguards in their data processing agreements, such as the EU Standard Contractual Clauses.",
    ],
  },
  {
    title: "How long we keep it",
    paragraphs: [
      "We keep your profile for as long as you are a member. When you delete your account, your profile, your LinkedIn link and your uploaded photos are removed straight away. Posts you wrote stay visible as written by a removed member. Access requests are kept only as long as needed to handle them; you can ask us to remove yours at any time.",
    ],
  },
  {
    title: "Your rights",
    items: [
      "See and download your data: use the download option on your profile page.",
      "Correct your data: edit your profile at any time.",
      "Delete your account: use the delete option on your profile page, or email us.",
      "Withdraw consent or object: hide your profile, or email us.",
      "Complain: you can file a complaint with the Dutch data protection authority, the Autoriteit Persoonsgegevens.",
    ],
  },
  {
    title: "Cookies",
    paragraphs: [
      "We only use cookies the hub needs to work: one that keeps you signed in and one that remembers your invite code while you sign in. We do not use tracking or advertising cookies.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Privacy"
      title="IN-IT Member Hub Privacy Policy"
      description="How we handle your personal data in the invite-only IN-IT community."
    >
      <div className="max-w-4xl rounded-[2rem] border border-charcoal/10 bg-white/76 p-8 shadow-sm">
        <p className="text-sm font-semibold text-charcoal/55">Last updated: September 28, 2026</p>
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
