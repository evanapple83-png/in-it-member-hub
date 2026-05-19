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
  visibilityStatus: text("visibility_status").default("pending").notNull(),
  consentGiven: boolean("consent_given").default(false).notNull(),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  authProvider: text("auth_provider").default("linkedin").notNull(),
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

export type MemberRow = typeof members.$inferSelect;
export type NewMemberRow = typeof members.$inferInsert;
export type InviteRow = typeof invites.$inferSelect;
export type CommunityRow = typeof communities.$inferSelect;
