"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Link2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LinkedInButton({ label = "Continue with LinkedIn", disabled = false }: { label?: string; disabled?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    try {
      await signIn("linkedin", { callbackUrl: "/onboarding" });
    } catch {
      setError("LinkedIn login is not configured yet. Add Auth.js and LinkedIn environment variables.");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button type="button" onClick={handleSignIn} disabled={disabled || loading} size="lg">
        {disabled ? <LockKeyhole className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
        {disabled ? "Invite code required" : loading ? "Opening LinkedIn..." : label}
      </Button>
      {error ? <p className="mt-3 text-sm font-semibold text-date">{error}</p> : null}
    </div>
  );
}
