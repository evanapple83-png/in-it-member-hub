"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function LocalDevSignIn() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function login(account: string) {
    setBusy(true);
    setError(false);
    try {
      const result = await signIn("local-dev", { account, callbackUrl: "/wachten", redirect: false });
      if (result?.ok && result.url) window.location.assign(result.url);
      else { setError(true); setBusy(false); }
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="sub">Lokale testaccounts</p>
      {[["admin", "Beheerder"], ["member", "Goedgekeurd lid"], ["pending", "Wachtend lid"]].map(([account, label]) => (
        <button key={account} className="btn ghost full" type="button" disabled={busy} onClick={() => login(account)}>
          {label}
        </button>
      ))}
      {error ? <p role="alert">Lokaal inloggen mislukt. Voer npm run db:local:setup uit.</p> : null}
    </div>
  );
}
