import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  linkedinUrl: text("linkedin_url"),
  photoUrl: text("photo_url"),
  headline: text("headline"),
  role: text("role"),
  company: text("company"),
  location: text("location"),
  about: text("about"),
  skills: text("skills").array().default(sql`'{}'::text[]`).notNull(),
  canHelpWith: text("can_help_with").array().default(sql`'{}'::text[]`).notNull(),
  lookingFor: text("looking_for").array().default(sql`'{}'::text[]`).notNull(),
  languages: text("languages").array().default(sql`'{}'::text[]`).notNull(),
  openToMentor: boolean("open_to_mentor").default(false).notNull(),
  openToOpportunities: boolean("open_to_opportunities").default(false).notNull(),
  openToCollaborate: boolean("open_to_collaborate").default(false).notNull(),
  openToSpeaking: boolean("open_to_speaking").default(false).notNull(),
  // 'member' (formeel lid) or 'friend' (vriend van IN-IT) — FRD §4
  memberType: text("member_type").default("member").notNull(),
  // Whitelist of profile field keys the member chose to expose publicly — FR-013, BP-004
  publicFields: text("public_fields").array().default(sql`'{}'::text[]`).notNull(),
  // AVG: member can opt out of activity/notification emails — §9.1
  emailOptOut: boolean("email_opt_out").default(false).notNull(),
  // 'pending' (aangevraagd) | 'approved'/'active' (goedgekeurd/actief) | 'hidden' | 'rejected' | 'deactivated' (gedeactiveerd) — FR-019
  visibilityStatus: text("visibility_status").default("pending").notNull(),
  consentGiven: boolean("consent_given").default(false).notNull(),
  // Optional note from the coordinator when an application is declined; shown on /wachten.
  rejectionReason: text("rejection_reason"),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  authProvider: text("auth_provider").default("linkedin").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// FR-004/005/020/021: digitale toegangsaanvraag (zelf-aanvraag of voorgedragen vriend),
// beoordeeld en geregistreerd door de coordinator. Vervangt het ongeregistreerde telefonische proces.
export const accessRequests = pgTable("access_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  // 'member' (lid) of 'friend' (vriend van IN-IT)
  requesterType: text("requester_type").default("member").notNull(),
  motivation: text("motivation"),
  linkedinUrl: text("linkedin_url"),
  // For friend nominations (FR-020): which authorized member proposed this person
  proposedByMemberId: uuid("proposed_by_member_id").references(() => members.id, { onDelete: "set null" }),
  // 'requested' | 'approved' | 'rejected'
  status: text("status").default("requested").notNull(),
  reviewNote: text("review_note"),
  reviewedByAdminId: uuid("reviewed_by_admin_id").references(() => admins.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  // The invite generated when this request was approved (FR-006)
  inviteId: uuid("invite_id").references(() => invites.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const linkedinAccounts = pgTable("linkedin_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "set null" }),
  linkedinSub: text("linkedin_sub").notNull().unique(),
  linkedinEmail: text("linkedin_email"),
  linkedinName: text("linkedin_name"),
  linkedinPicture: text("linkedin_picture"),
  provider: text("provider").default("linkedin").notNull(),
  connectedAt: timestamp("connected_at", { withTimezone: true }).defaultNow().notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).defaultNow().notNull(),
});

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  role: text("role").default("admin").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  codeHash: text("code_hash").notNull().unique(),
  email: text("email"),
  note: text("note"),
  status: text("status").default("active").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  usedByUserId: text("used_by_user_id"),
  createdByAdminId: uuid("created_by_admin_id").references(() => admins.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const communities = pgTable(
  "communities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").default("professional").notNull(),
    isPrivate: boolean("is_private").default(true).notNull(),
    // Optional uploaded cover (Vercel Blob URL); null falls back to a crop of the hero image.
    coverImageUrl: text("cover_image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("communities_slug_idx").on(table.slug)],
);

export const communityMemberships = pgTable(
  "community_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    contributionScore: integer("contribution_score").default(0).notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("community_memberships_unique_idx").on(table.communityId, table.memberId)],
);

// FR-023/024: activiteitenagenda. Alleen de coordinator beheert activiteiten; gepubliceerde
// activiteiten zijn zichtbaar voor ingelogde geautoriseerde leden (FR-025).
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    category: text("category").default("community").notNull(),
    // Manual Google Meet / Calendar link (Phase 4a) or generated via Calendar API (Phase 4b)
    meetLink: text("meet_link"),
    calendarLink: text("calendar_link"),
    googleEventId: text("google_event_id"),
    coverImageUrl: text("cover_image_url"),
    // 'draft' | 'published'
    status: text("status").default("draft").notNull(),
    audience: text("audience").default("all").notNull(),
    createdByAdminId: uuid("created_by_admin_id").references(() => admins.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("events_slug_idx").on(table.slug)],
);

export const eventRsvps = pgTable(
  "event_rsvps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    // 'going' | 'maybe' | 'declined'
    status: text("status").default("going").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("event_rsvps_unique_idx").on(table.eventId, table.memberId)],
);

// Phase 5: lightweight posts feed inside a community room (not in the original FRD scope —
// an explicit extra requested by Evan, kept besloten/login-only).
export const communityPosts = pgTable("community_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  communityId: uuid("community_id")
    .notNull()
    .references(() => communities.id, { onDelete: "cascade" }),
  authorMemberId: uuid("author_member_id").references(() => members.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  // 'published' | 'hidden' (moderation)
  status: text("status").default("published").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Phase 6: ledenblog over ervaringen + "Showcase van de week" (extra-wens van Evan,
// niet in de FRD; besloten/login-only net als de community rooms).
export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    coverImageUrl: text("cover_image_url"),
    authorMemberId: uuid("author_member_id").references(() => members.id, { onDelete: "set null" }),
    // 'published' | 'hidden' (moderation by beheerder)
    status: text("status").default("published").notNull(),
    // Beheerder markeert een post; meest recent gemarkeerde gepubliceerde post = Showcase van de week
    showcasedAt: timestamp("showcased_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("blog_posts_slug_idx").on(table.slug)],
);

export type MemberRow = typeof members.$inferSelect;
export type NewMemberRow = typeof members.$inferInsert;
export type InviteRow = typeof invites.$inferSelect;
export type CommunityRow = typeof communities.$inferSelect;
export type AccessRequestRow = typeof accessRequests.$inferSelect;
export type NewAccessRequestRow = typeof accessRequests.$inferInsert;
export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;
export type EventRsvpRow = typeof eventRsvps.$inferSelect;
export type CommunityPostRow = typeof communityPosts.$inferSelect;
export type BlogPostRow = typeof blogPosts.$inferSelect;
