# IN-IT Member Hub

A community hub for Iraqi IT professionals in the Netherlands, with member profiles,
communities, events, stories, invite-based membership and admin tools.

This is a full-stack Next.js application: pages and components provide the frontend,
route handlers and server functions provide the backend, and Postgres stores the data.
The stack includes TypeScript, React, Tailwind CSS, Drizzle ORM, NextAuth with LinkedIn
OpenID Connect, and Vercel Blob for hosted uploads.

## Local quick start

Install **Node.js 22+**, **npm**, and **Docker with Compose**. From the repository root:

```bash
npm ci
cp .env.local.example .env.local
```

Generate a session secret and replace `NEXTAUTH_SECRET` in `.env.local` with the output:

```bash
openssl rand -base64 32
```

Then start the database, apply migrations, seed the demo and start the application:

```bash
npm run db:local:up
npm run db:local:setup
npm run dev
```

Open [http://localhost:3000/inloggen](http://localhost:3000/inloggen) and choose:

| Local account | Access |
| --- | --- |
| Beheerder | Approved member and administrator |
| Goedgekeurd lid | Approved member |
| Wachtend lid | Member awaiting approval |

No LinkedIn, Neon, Vercel or Resend credentials are needed for this local workflow.
Public pages are available without logging in. The seed includes **24 fictional Iraqi IT
professionals with 1–22 years of experience**, all with selected public profile fields,
plus test members, communities, events, posts, a comment, an RSVP and an access request.
The profiles use fictional employers and `example.test` email addresses; they have initials
rather than profile photos.

Postgres runs at `127.0.0.1:55432`, database `init_member_hub`, user `init`, password
`init_local`. The app uses the TCP Postgres driver for loopback database URLs and the Neon
HTTP driver for hosted URLs. If port 55432 is occupied, change the host port in
[compose.yaml](compose.yaml) and `DATABASE_URL` together.

`npm run db:local:setup` loads `.env.local`, applies pending SQL files once using
`local_dev_migrations`, and seeds demo data without duplicates. Existing demo edits and
public visibility settings are preserved. Run it again after pulling new migrations.
It only accepts loopback database URLs; its migration tracking is for local development.
Do not alternate it with `db:push` on the same database.

Stop Postgres with `npm run db:local:down`; its Docker volume retains the data. Restart it
with `npm run db:local:up`. Local CV files persist separately in `.local/member-cvs/`.

Local test login is opt-in through `LOCAL_DEV_AUTH=true`. It requires development mode,
loopback database and application URLs, and no Vercel environment. `npm run dev` binds to
loopback. Production builds disable local login. To test the real LinkedIn flow locally,
set `LOCAL_DEV_AUTH=false` and configure the LinkedIn variables below.

## Environment variables

Use [.env.local.example](.env.local.example) for local Postgres and test login, or copy
[.env.example](.env.example) to `.env.local` for a hosted development database. Actual
`.env*` files are ignored by Git; the two examples are committed.

| Variable | Purpose | Local demo | Hosted deployment |
| --- | --- | --- | --- |
| `DATABASE_URL` | Database connection string | Provided in local example | Neon Postgres URL |
| `NEXTAUTH_URL` | Application origin | `http://localhost:3000` | Your HTTPS domain |
| `NEXTAUTH_SECRET` | Session signing secret | Generate your own | Generate your own |
| `LOCAL_DEV_AUTH` | Enable local test accounts | `true` | `false` or unset |
| `BOOTSTRAP_ADMIN_EMAILS` | Comma-separated verified LinkedIn emails allowed to bootstrap admin access | Not needed | Set for the first admin |
| `LINKEDIN_CLIENT_ID` | LinkedIn OIDC client ID | Optional | Required for sign-in |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OIDC client secret | Optional | Required for sign-in |
| `BLOB_READ_WRITE_TOKEN` | Token for the **public** photo/cover Blob store | Optional; required for photo uploads | Required for photo/cover uploads |
| `CV_BLOB_READ_WRITE_TOKEN` | Token for a separate **private** CV Blob store | Leave empty for local file storage | Required for CV uploads/downloads |
| `RESEND_API_KEY` | Email delivery through Resend | Optional; attempts are logged when unset | Required to deliver activation and event emails |
| `EMAIL_FROM` | Resend sender address | Example test sender supplied | Set to a sender configured in Resend |

Next.js loads `.env.local` for the application. The local database setup and Drizzle config
also load environment files. `NODE_ENV` is managed by the Next.js commands; `VERCEL` and
`VERCEL_ENV` are supplied by Vercel. Do not set these to enable local features in deployment.

Without `DATABASE_URL`, some pages can render demo data, but authenticated member features,
admin tools and CV uploads require a configured database.

## Database and migrations

The schema is defined in [src/db/schema.ts](src/db/schema.ts). Checked-in SQL migrations in
[drizzle/](drizzle/) also contain constraints, triggers and the rate-limit table, which are
not all represented by Drizzle schema synchronization.

For a **fresh hosted database**, create a Neon project, put its pooled connection string in
`.env.local`, and apply the numbered SQL migrations in order. These commands require `psql`
and a `DATABASE_URL` exported in your shell; `psql` does not load `.env.local` itself:

```bash
export DATABASE_URL='postgresql://user:password@your-neon-host/db?sslmode=require'
(
  set -e
  for migration in drizzle/[0-9][0-9][0-9][0-9]_*.sql; do
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f "$migration"
  done
)
```

For an **existing hosted database**, apply only the pending migration files and record
which were applied in your deployment process. This repository does not currently provide
a hosted migration-history runner. For the CV feature, the new migration is:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f drizzle/0010_member_cvs.sql
```

`npm run db:push` is available for Drizzle schema synchronization, but does not replace the
SQL migration workflow. `npm run db:generate` generates migrations for review; reconcile
these with the existing SQL history before applying them. Local seeding uses
`drizzle/seed.sql`, `drizzle/seed-local.sql` and `drizzle/seed-it-members.sql`. Keep demo data
in development databases.

## Public profiles and membership

The guest homepage introduces IN-IT, previews up to six opted-in public profiles, explains
community benefits and joining steps, and links to `/request-access`. Approved members
visiting `/` are redirected to `/vandaag`. Development previews label possible demo members;
production homepage previews exclude seeded profiles with `@example.test` email addresses.
No testimonials or membership statistics are fabricated. Public field restrictions apply
to the homepage preview as well as the directory.

Guests can browse `/members` and `/profile/[id]`. A public profile requires all three:

- `visibility_status = 'approved'`.
- `consent_given = true`.
- At least one supported field selected in `public_fields`.

Name is always visible for an opted-in public profile. Only selected fields are included in
guest pages, search data and browser payloads. Email, account identifiers and CVs are never
public. Private, unapproved or non-consenting profiles return 404 to guests.

Anonymous visits to `/members/[id]` use the same public view. Old `/p/[id]` links redirect to
`/profile/[id]`. Approved signed-in members retain the full directory and detailed
`/members/[id]` profiles, including members who did not opt into public visibility.
Members control public fields through **Profiel bewerken**.

New members request access at `/request-access` or use an invitation at `/join`. Admins
review requests in `/admin/requests` and manage invitations in `/admin/invites`. Invitation
codes expire after 24 hours, are stored hashed, and are consumed during LinkedIn sign-in.
Members finish onboarding and await approval before entering the private hub.

## LinkedIn and admin setup

Configure a LinkedIn app with **Sign in with LinkedIn using OpenID Connect**, scopes
`openid profile email`, and these redirect URIs:

```text
http://localhost:3000/api/auth/callback/linkedin
https://<your-domain>/api/auth/callback/linkedin
```

Set `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `NEXTAUTH_URL` and `NEXTAUTH_SECRET`.
For the first admin, add their verified LinkedIn email to `BOOTSTRAP_ADMIN_EMAILS` and sign
in at `/inloggen`. Sign-in creates the admin row automatically and allows bootstrap access
before invitations or an approved profile exist.

To grant admin access to another existing user, insert their LinkedIn subject/session ID:

```sql
insert into admins (user_id, role) values ('<linkedin-sub>', 'admin');
```

Admin access normally requires an approved member and a matching `admins` row. Bootstrap
admins have an exception so they can finish initial setup. LinkedIn supplies basic identity
data (name, email, picture and subject); other profile details are entered manually.

## Media storage and CVs

| Media | Storage | Access |
| --- | --- | --- |
| Logos, backgrounds and icons | Repository `public/` folder | Public |
| Uploaded profile photos and community covers | Public Vercel Blob store | Public URLs |
| Local development CVs | `.local/member-cvs/` | Authenticated application downloads |
| Hosted CVs | Separate private Vercel Blob store | Authenticated application downloads |

Create a **public** Blob store for images and configure `BLOB_READ_WRITE_TOKEN`. Photos and
covers have no local filesystem fallback. For CVs, create a **private** Blob store and set
its separate token as `CV_BLOB_READ_WRITE_TOKEN`. An image-store token is not a substitute
for the private CV-store token.

Approved members manage one PDF CV from **`/profile` → Je cv**: upload, replace, download or
remove. The limit is **4 MB**. The server checks the extension, MIME type, PDF header and end
marker and bounds the multipart request size. Only the owner and authorized administrators
can download a CV. Admins see a download link on the member's full profile when a CV exists.

CV metadata is stored in the separate `member_cvs` table, outside member directory data.
Downloads go through an authorization check and use attachment and no-store headers.
Replacement removes the previous file; removal and account deletion clean up the stored
file. Account export includes CV metadata and the authenticated download link.

Local file storage is used only in development, with a loopback database, outside Vercel,
and when `CV_BLOB_READ_WRITE_TOKEN` is empty. Supplying the token selects private Blob
storage instead. `.local/` is ignored by Git. Moving database data between environments does
not transfer CV files; retain the matching storage alongside its metadata.

CV endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/me/cv` | Own CV metadata |
| `POST` | `/api/me/cv` | Upload or replace; multipart field `file` |
| `DELETE` | `/api/me/cv` | Remove own CV |
| `GET` | `/api/members/[id]/cv` | Download as the owner or an authorized admin |

## Commands and checks

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local application at port 3000 |
| `npm run db:local:up` | Start Postgres and wait for readiness |
| `npm run db:local:setup` | Apply pending local migrations and seed data |
| `npm run db:local:down` | Stop Postgres, retaining data |
| `npm run lint` | ESLint |
| `npm run build` | Production build, including TypeScript checks |
| `npm start` | Serve a production build; local test login is disabled |
| `npm run test:local-auth` | Local-login environment guards |
| `npm run test:public-profiles` | Public-field projection and visibility rules |
| `npm run test:cv` | PDF upload and request-size validation |
| `npm run test:public-members` | Public directory, private fields and signed-in access |
| `npm run test:cv:integration` | CV upload, replacement, access, removal and account cleanup |

Integration checks require the local database, seed data and development server at
`http://localhost:3000`, with local login enabled. CV integration checks also require an
empty `CV_BLOB_READ_WRITE_TOKEN` so they use local file storage. They create temporary
fixtures and remove them afterward.

The older `npm run db:seed` command only loads `drizzle/seed.sql` and requires `psql` plus a
shell-exported `DATABASE_URL`; use `db:local:setup` for the complete local demo.

## Project map

- `src/app/(public)/`: public pages and public profile details.
- `src/app/(directory)/`: directory routes with guest and signed-in views.
- `src/app/(app)/`: private member hub, events, communities, stories and profile settings.
- `src/app/(auth)/`: sign-in, joining, onboarding and waiting screens.
- `src/app/admin/`: admin pages.
- `src/app/api/`: HTTP API handlers.
- `src/components/`: UI components.
- `src/lib/`: authentication, access rules, queries, validation and storage helpers.
- `src/db/` and `drizzle/`: database schema, mapping, SQL migrations and seeds.
- `tests/`: validation, access and integration checks.

Route-group folder names in parentheses do not appear in URLs. Pages often read data
through server functions; browser interactions use API handlers for changes.

## Deployment checklist

1. Create the Vercel project and Neon database.
2. Apply the required numbered SQL migrations, including `0010_member_cvs.sql`.
3. Configure environment variables from `.env.example`, using your HTTPS `NEXTAUTH_URL`
   and a generated secret. Leave local test login disabled.
4. Configure LinkedIn credentials and the production callback URI.
5. Configure the public photo/cover Blob store and separate private CV Blob store.
6. Configure Resend and `EMAIL_FROM` if activation and event emails should be delivered.
7. Set the first admin's verified email in `BOOTSTRAP_ADMIN_EMAILS`, deploy, and sign in.
8. Test an invitation, onboarding, approval, public field visibility, and private CV
   upload/download/removal. Confirm guests and other members cannot download a CV.

## Current limitations

- Member matching and search are keyword-based.
- Hosted migrations are applied explicitly; automatic hosted migration tracking is not set up.
- Photo and cover uploads require Vercel Blob even during local development.
- CV storage and permissions have local integration coverage; hosted storage requires the
  private Blob store configuration above.
