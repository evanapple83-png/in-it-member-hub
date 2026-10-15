import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthSplit } from "@/components/app/AuthSplit";
import { LinkedInSignIn } from "@/components/access/LinkedInSignIn";
import { Icon } from "@/components/ui/icon";
import { getAccessState, homeForState } from "@/lib/access-state";
import { isLocalDevAuthEnabled } from "@/lib/local-dev-auth";
import { LocalDevSignIn } from "@/components/access/LocalDevSignIn";

export const metadata = { title: "Inloggen | IN-IT" };

const QUOTE = {
  title: "Iraqi Network of Information Technology",
  text: "Een besloten netwerk van IT-professionals met Iraakse roots in Nederland.",
};

// next-auth sends every failed sign-in here as ?error=<code>. AccessDenied means our signIn
// callback said no: an unknown LinkedIn account, or an invite code that no longer works.
export default async function InloggenPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { state } = await getAccessState();
  if (!error && state !== "anon") redirect(homeForState(state));

  if (error === "AccessDenied") {
    const hadCode = Boolean((await cookies()).get("in_it_invite_code")?.value);
    if (hadCode) {
      return (
        <AuthSplit crop="c-bridge" quote={QUOTE}>
          <div>
            <h1>Deze code werkt niet meer</h1>
            <p className="sub" style={{ marginTop: 6 }}>
              De code is verlopen, al gebruikt, of hoort bij een ander e-mailadres dan dat van je LinkedIn-account. Vraag de beheerder om een nieuwe code.
            </p>
          </div>
          <Link data-press className="btn dark full" href="/join">
            <Icon name="key" />
            Andere code invullen
          </Link>
          <LinkedInSignIn label="Ander LinkedIn-account proberen" />
          <Link data-press className="btn ghost full" href="/request-access">
            Toegang aanvragen zonder code
          </Link>
        </AuthSplit>
      );
    }
    return (
      <AuthSplit crop="c-bridge" quote={QUOTE}>
        <div>
          <h1>We kennen dit LinkedIn-account nog niet</h1>
          <p className="sub" style={{ marginTop: 6 }}>
            Misschien werd je lid met een ander LinkedIn-account. Log dan daarmee in. Ben je nieuw, gebruik dan je uitnodigingscode.
          </p>
        </div>
        <LinkedInSignIn label="Ander LinkedIn-account proberen" />
        <Link data-press className="btn dark full" href="/join">
          <Icon name="key" />
          Ik heb een uitnodigingscode
        </Link>
        <Link data-press className="btn ghost full" href="/request-access">
          Toegang aanvragen zonder code
        </Link>
      </AuthSplit>
    );
  }

  return (
    <AuthSplit crop="c-canal" quote={QUOTE}>
      <div>
        <h1>Welkom terug</h1>
        <p className="sub" style={{ marginTop: 6 }}>
          Log in met het LinkedIn-account waarmee je lid bent geworden. Een code heb je niet meer nodig.
        </p>
      </div>
      {error ? (
        <p className="msg err" role="alert">
          <Icon name="info" />
          Inloggen lukte net niet. Probeer het nog een keer.
        </p>
      ) : null}
      <LinkedInSignIn label="Inloggen met LinkedIn" />
      {isLocalDevAuthEnabled() ? <LocalDevSignIn /> : null}
      <div className="or">nieuw bij IN-IT</div>
      <Link data-press className="btn ghost full" href="/join">
        <Icon name="key" />
        Ik heb een uitnodigingscode
      </Link>
    </AuthSplit>
  );
}
