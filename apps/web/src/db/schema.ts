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