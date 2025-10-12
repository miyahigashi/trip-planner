// apps/web/src/db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  doublePrecision,
  uniqueIndex,
  index,
  primaryKey,
  unique,
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/** users */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),                        // アプリ内ユーザーID(UUID)
    clerkUserId: text("clerk_user_id").notNull().unique(),              // Clerkの userId(例: "user_xxx")
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    usersEmailIdx: uniqueIndex("uniq_users_email").on(t.email),
  })
);

/** places */
export const places = pgTable(
  "places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: text("place_id").notNull().unique(), // Google Places の place_id
    name: text("name").notNull(),
    prefecture: text("prefecture"),
    address: text("address"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    priceInfo: text("price_info"),
    imageUrl: text("image_url"),
    summary: text("summary"),
    source: text("source"),
    sourceId: text("source_id").unique(),
    rating: doublePrecision("rating"),
    userRatingsTotal: integer("user_ratings_total"),
    types: text("types").array(), // text[]
    photoRef: text("photo_ref"),
    lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
    
  },
  (t) => ({
    placeIdIdx: index("idx_places_place_id").on(t.placeId),
  })
);

/** wishlists */
export const wishlists = pgTable(
  "wishlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    placeId: text("place_id").notNull().references(() => places.placeId, { onDelete: "cascade" }),
    note: text("note"),
    score: integer("score").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqUserPlace: uniqueIndex("uniq_wishlists_user_place").on(t.userId, t.placeId),
  })
);

export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  coverPhotoUrl: text("cover_photo_url"),
  status: text("status").notNull().default("draft"),
  tags: text("tags").array(),              // text[]
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** projects */
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }), // 内部UUID
  title: text("title").notNull(),
  description: text("description"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** project_prefectures（複数都道府県） */
export const projectPrefectures = pgTable(
  "project_prefectures",
  {
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    prefecture: text("prefecture").notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.projectId, t.prefecture] }) }),
);

/** project_members（メンバー/ゲスト招待） */
export const projectMembers = pgTable(
  "project_members",
  {
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id"), // users.id（ゲストは null）
    role: text("role").$type<"owner" | "editor" | "viewer">().default("editor").notNull(),
    displayName: text("display_name"),
    email: text("email"),
    status: text("status").$type<"active" | "invited">().default("active").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.projectId, t.userId] }) }),
);

/** project_invites（招待リンク/メール） */
export const projectInvites = pgTable("project_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  email: text("email"),
  token: text("token").notNull(),
  role: text("role").$type<"editor" | "viewer">().default("editor").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  claimedByUserId: uuid("claimed_by_user_id"),
});

/** project_candidates（みんなのウィッシュから候補へ） */
export const projectCandidates = pgTable(
  "project_candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    placeId: text("place_id")
      .notNull()
      .references(() => places.placeId, { onDelete: "restrict" }),
    addedByUserId: uuid("added_by_user_id"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ uniq: unique().on(t.projectId, t.placeId) }),
);

/** candidate_votes（任意：投票） */
export const candidateVotes = pgTable(
  "candidate_votes",
  {
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id").notNull().references(() => projectCandidates.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    value: integer("value").default(1).notNull(), // +1/-1 など
  },
  (t) => ({ pk: primaryKey({ columns: [t.projectId, t.candidateId, t.userId] }) }),
);

/** project_selections（最終確定・日割り） */
export const projectSelections = pgTable(
  "project_selections",
  {
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    placeId: text("place_id")
      .notNull()
      .references(() => places.placeId, { onDelete: "restrict" }),
    dayIndex: integer("day_index"),
    orderInDay: integer("order_in_day"),
    note: text("note"),
  },
  (t) => ({ pk: primaryKey({ columns: [t.projectId, t.placeId] }) }),
);
