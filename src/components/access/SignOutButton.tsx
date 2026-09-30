"use client";

import { signOut } from "next-auth/react";
import { Icon } from "@/components/ui/icon";

export function SignOutButton() {
  return (
    <button data-press className="btn ghost" type="button" onClick={() => signOut({ callbackUrl: "/inloggen" })}>
      <Icon name="logout" />
      Uitloggen
    </button>
  );
}
