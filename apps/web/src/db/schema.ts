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
  varchar,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";


/** users */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),                        // アプリ内ユーザーID(UUID)
    clerkUserId: text("clerk_user_id").notNull().unique(),              // Clerkの userId(例: "user_xxx")
    email: text("email").notNull(),
    handle: text("handle"),                    // 例: "taro_yamada"
    bio: text("bio"),
    avatarKey: text("avatar_key"),             // GCS などのオブジェクトキー
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    usersEmailIdx: uniqueIndex("uniq_users_email").on(t.email),
    uniqHandleCi: uniqueIndex("uniq_users_handle_ci").on(sql`lower(${t.handle})`).where(sql`${t.handle} is not null`),
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
    // ★追加：自分のリストを新しい順で読むクエリ最適化
    byUserCreated: index("idx_wishlists_user_created").on(t.userId, t.createdAt),
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
  (t) => ({
  uniquePair: uniqueIndex("project_candidates_unique").on(t.projectId, t.placeId),
  byProject: index("idx_project_candidates_project").on(t.projectId),
}));

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
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    placeId: text("place_id")
      .notNull()
      .references(() => places.placeId, { onDelete: "restrict" }),
    // 並び用は NOT NULL にするのが理想（下のマイグレーションで段階的に）
    dayIndex: integer("day_index"),       // ← 後で NOT NULL + default 0 に
    orderInDay: integer("order_in_day"),  // ← 同上
    note: text("note"),
  },
  (t) => ({
    // 既存：同じplaceIdの二重確定を防止
    pk: primaryKey({ columns: [t.projectId, t.placeId] }),

    // ★追加：同日の同順番の重複を防止（並びの一意性）
    uniqueSlot: uniqueIndex("project_selections_unique_slot").on(
      t.projectId,
      t.dayIndex,
      t.orderInDay
    ),

    // ★追加：一覧・並び用の索引
    byProject: index("idx_project_selections_project").on(t.projectId),
    bySort: index("idx_project_selections_sort").on(
      t.projectId,
      t.dayIndex,
      t.orderInDay
    ),
  })
);

// --- プロフィール（users 1:1） ---
export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarKey: text("avatar_key"), // GCS: "avatars/{uuid}/w400.webp" など
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- フレンド（シンプル相互承認モデル） ---
export const friendships = pgTable(
  "friendships",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    friendId: uuid("friend_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: text("status").$type<"pending" | "accepted" | "blocked">().default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    // リクエスト発行者（片側だけ pending を持つ設計）
    requestedBy: uuid("requested_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.friendId] }),
  })
);

export const projectCandidateVotes = pgTable(
  "project_candidate_votes",
  {
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    placeId: text("place_id").notNull().references(() => places.placeId, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.projectId, t.placeId, t.userId] }),
    byProjectPlace: index("idx_votes_project_place").on(t.projectId, t.placeId),
    byProjectUser: index("idx_votes_project_cuser").on(t.projectId, t.userId),
    uniq: uniqueIndex("uniq_vote_per_user").on(t.projectId, t.placeId, t.userId),
  })
);

// users から project_candidate_votes への 1:N
export const usersRelations = relations(users, ({ many }) => ({
  projectCandidateVotes: many(projectCandidateVotes),
}));

// project_candidate_votes 側からの参照（N:1）

export const projectCandidateVotesRelations = relations(projectCandidateVotes, ({ one }) => ({
  user: one(users, {
    fields: [projectCandidateVotes.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [projectCandidateVotes.projectId],
    references: [projects.id],
  }),
  place: one(places, {
    fields: [projectCandidateVotes.placeId],
    references: [places.placeId],
  }),
}));