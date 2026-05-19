import type { NextAuthOptions } from "next-auth";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { linkedinAccounts } from "@/db/schema";
import { getActiveInviteByCode, redeemInviteCode } from "@/lib/invites";

function isBootstrapAdminEmail(email?: string | null) {
  const allowed = process.env.BOOTSTRAP_ADMIN_EMAILS?.split(",").map((item) => item.trim().toLowerCase()) ?? [];
  return Boolean(email && allowed.includes(email.toLowerCase()));
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    {
      id: "linkedin",
      name: "LinkedIn",
      type: "oauth",
      wellKnown: "https://www.linkedin.com/oauth/.well-known/openid-configuration",
      authorization: { params: { scope: "openid profile email" } },
      idToken: true,
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      checks: ["state"],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ user, profile }) {
      if (!hasDatabase()) return true;

      const linkedinProfile = profile as { sub?: string; email?: string; name?: string; picture?: string } | undefined;
      const linkedinSub = linkedinProfile?.sub ?? user.id;
      const email = linkedinProfile?.email ?? user.email;
      if (!linkedinSub) return false;

      if (isBootstrapAdminEmail(email)) return true;

      const db = getDb();
      const [existingAccount] = await db
        .select({ id: linkedinAccounts.id })
        .from(linkedinAccounts)
        .where(eq(linkedinAccounts.linkedinSub, linkedinSub))
        .limit(1);

      if (existingAccount) return true;

      const inviteCode = (await cookies()).get("in_it_invite_code")?.value;
      if (!inviteCode) return false;

      const invite = await getActiveInviteByCode(inviteCode);
      if (!invite) return false;

      if (invite.email && email && invite.email.toLowerCase() !== email.toLowerCase()) return false;

      const redeemedInvite = await redeemInviteCode(inviteCode, linkedinSub);
      if (!redeemedInvite) return false;

      await db
        .insert(linkedinAccounts)
        .values({
          userId: linkedinSub,
          linkedinSub,
          linkedinEmail: email,
          linkedinName: linkedinProfile?.name ?? user.name,
          linkedinPicture: linkedinProfile?.picture ?? user.image,
          provider: "linkedin",
          lastSyncedAt: new Date(),
        })
        .onConflictDoNothing();

      return true;
    },
    async jwt({ token, profile }) {
      if (profile?.sub) {
        const linkedinProfile = profile as { sub: string; picture?: string };
        token.linkedinSub = profile.sub;
        token.linkedinPicture = linkedinProfile.picture;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = (token.linkedinSub as string | undefined) ?? token.sub ?? "";
      session.user.image = (token.linkedinPicture as string | undefined) ?? session.user.image;
      return session;
    },
  },
  pages: {
    signIn: "/join",
    error: "/join",
  },
};
