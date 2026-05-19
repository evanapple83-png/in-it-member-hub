# IN-IT Member Hub V0.2

Premium MVP for the Iraqi Network of Information Technology: a smart, searchable community hub for Iraqi tech professionals in the Netherlands to discover each other, find expertise, connect, mentor and grow together.

## Recommended MVP stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style local primitives
- Framer Motion
- lucide-react
- Vercel hosting
- Neon Postgres
- Drizzle ORM
- Auth.js / NextAuth with LinkedIn OpenID Connect
- Vercel Blob for profile photos
- Invite-only access with 24-hour admin codes

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Without `DATABASE_URL`, the app can render the public marketing surface, but invite-only auth, admin tools and private member areas require Neon.

## Environment variables

```bash
DATABASE_URL=

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
BOOTSTRAP_ADMIN_EMAILS=

LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

BLOB_READ_WRITE_TOKEN=
```

## Neon database setup

1. Create a Neon project.
2. Copy the pooled connection string.
3. Add it as `DATABASE_URL`.
4. Run the schema:

```bash
npx drizzle-kit push
```

Optional fake DB seed:

```bash
psql "$DATABASE_URL" -f drizzle/seed.sql
```

The schema lives in:

- `src/db/schema.ts`
- `drizzle/0000_init_member_hub.sql`
- `drizzle/0001_invites_and_communities.sql`

Public directory rule:

```sql
visibility_status = 'approved'
and consent_given = true
```

Pending, hidden, rejected and non-consented profiles are not public.

## Invite-only access

Guest visitors only see the public homepage and about page. Member directory, profiles, communities, contact, onboarding, profile settings and admin areas are protected.

Invite flow:

1. Admin creates a 24-hour invite code in `/admin/invites`.
2. Candidate opens `/join` or `/join?code=INIT-XXXXXXXX`.
3. The code is validated and stored in an httpOnly cookie.
4. LinkedIn sign-in starts only after the invite is valid.
5. The code is consumed during LinkedIn sign-in and cannot be reused.
6. The member completes onboarding and remains pending until admin approval.

For first-time setup, add your own email to `BOOTSTRAP_ADMIN_EMAILS` so you can sign in before invite codes exist. Then insert your LinkedIn subject into `admins`.

## LinkedIn Developer App setup

1. Go to the LinkedIn Developer Dashboard.
2. Create a LinkedIn app.
3. Enable or request `Sign in with LinkedIn using OpenID Connect`.
4. Add this local redirect URI:

```text
http://localhost:3000/api/auth/callback/linkedin
```

5. Add the production Vercel redirect URI:

```text
https://<your-domain>/api/auth/callback/linkedin
```

6. Configure scopes:

```text
openid
profile
email
```

7. Add `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `NEXTAUTH_URL` and `NEXTAUTH_SECRET`.
8. Test `/join`.
9. Confirm `/onboarding` prefills name, email and picture when LinkedIn returns them.

No LinkedIn scraping, connection import or bulk profile import is implemented.

LinkedIn OIDC standard scopes return basic identity data only: name, email, profile picture and subject identifier. Role, company, headline, work experience, education and skills are not available through the standard sign-in scopes and remain manually entered in onboarding.

## Vercel Blob setup

1. In Vercel, open Storage.
2. Create a Blob store.
3. Copy `BLOB_READ_WRITE_TOKEN`.
4. Add it to local `.env.local` and Vercel project environment variables.

Onboarding uploads profile photos to Vercel Blob when a signed-in Auth.js session exists.

## Creating an admin user

After a user signs in with LinkedIn, use their LinkedIn subject/session user id and insert it:

```sql
insert into admins (user_id, role)
values ('<linkedin-sub>', 'admin');
```

Admin pages and admin APIs require an Auth.js session and a matching row in `admins`.

## Routes

- `/`
- `/members`
- `/members/[id]`
- `/join`
- `/about`
- `/contact`
- `/communities`
- `/communities/[slug]`
- `/onboarding`
- `/profile`
- `/admin`
- `/admin/invites`
- `/admin/members`
- `/admin/members/pending`
- `/admin/import`

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import it in Vercel.
3. Add all environment variables.
4. Add the Vercel callback URL to LinkedIn:

```text
https://<your-domain>/api/auth/callback/linkedin
```

5. Run the Drizzle schema against Neon.
6. Deploy.

## Same-day MVP launch checklist

1. Create Neon project and copy `DATABASE_URL`.
2. Create Vercel project and add env vars from `.env.example`.
3. Create Vercel Blob store and add `BLOB_READ_WRITE_TOKEN`.
4. Create LinkedIn Developer App and add callback URLs.
5. Run `npm run db:push`.
6. Add your email to `BOOTSTRAP_ADMIN_EMAILS` and sign in once through `/join`.
7. Insert your LinkedIn subject into `admins`.
8. Create an invite in `/admin/invites`.
9. Test `/join?code=<invite-code>` with LinkedIn.
10. Submit a test profile through `/onboarding`.
11. Approve it in `/admin/members/pending`.
12. Confirm it appears in `/members` after approved member sign-in.

## Known limitations

- Smart matching is keyword-based, not semantic AI search.
- Community rooms are private placeholders for now; posts/events can be added next.
- Admin edit UI has action affordances; approval, rejection, hide, delete and CSV import are wired.

## Future roadmap

- Rich admin edit modal.
- Community posts, events and moderation.
- Member-to-member introductions.
- Semantic search with embeddings.
- Event listings and RSVP.
- Richer notification and review workflows.
