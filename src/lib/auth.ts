import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { admins, linkedinAccounts, members } from "@/db/schema";
import { getActiveInviteByCode, redeemInviteCode } from "@/lib/invites";
import { isLocalDevAuthEnabled, LOCAL_DEV_USERS } from "@/lib/local-dev-auth";

export function isBootstrapAdminEmail(email?: string | null) {
  const allowed = process.env.BOOTSTRAP_ADMIN_EMAILS?.split(",").map((item) => item.trim().toLowerCase()) ?? [];
  return Boolean(email && allowed.includes(email.toLowerCase()));
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // A week, refreshed daily while in use. Access itself is re-checked against the database on
  // every request (access-state.ts), so this only bounds how long a stolen cookie stays useful.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  providers: [
    ...(isLocalDevAuthEnabled() ? [CredentialsProvider({
      id: "local-dev",
      name: "Local development",
      credentials: { account: { label: "Account", type: "text" } },
      async authorize(credentials) {
        if (!isLocalDevAuthEnabled()) return null;
        const account = credentials?.account;
        if (!account || !Object.hasOwn(LOCAL_DEV_USERS, account)) return null;
        const user = LOCAL_DEV_USERS[account as keyof typeof LOCAL_DEV_USERS];
        const [member] = await getDb().select({ id: members.id }).from(members).where(eq(members.userId, user.id)).limit(1);
        return member ? user : null;
      },
    })] : []),
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
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
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
    async signIn({ user, profile, account }) {
      if (account?.provider === "local-dev") return isLocalDevAuthEnabled();
      if (!hasDatabase()) return true;

      const linkedinProfile = profile as
        | { sub?: string; email?: string; email_verified?: boolean | string; name?: string; picture?: string }
        | undefined;
      const linkedinSub = linkedinProfile?.sub ?? user.id;
      const email = linkedinProfile?.email ?? user.email;
      if (!linkedinSub) return false;

      const db = getDb();

      // Emails in BOOTSTRAP_ADMIN_EMAILS get in without an invite AND hold an admin row, so a
      // founder can never be locked out of /admin (June incident). Idempotent on every sign-in.
      const emailVerified = linkedinProfile?.email_verified === true || linkedinProfile?.email_verified === "true";
      if (emailVerified && isBootstrapAdminEmail(email)) {
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
        const [admin] = await db.select({ id: admins.id }).from(admins).where(eq(admins.userId, linkedinSub)).limit(1);
        if (!admin) await db.insert(admins).values({ userId: linkedinSub });
        return true;
      }

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

      // An email-locked invite needs LinkedIn to confirm that exact address.
      if (invite.email && (!email || invite.email.toLowerCase() !== email.toLowerCase())) return false;

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
    signIn: "/inloggen",
    error: "/inloggen",
  },
};
