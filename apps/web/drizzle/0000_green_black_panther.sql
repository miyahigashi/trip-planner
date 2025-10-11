CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" text NOT NULL,
	"name" text NOT NULL,
	"prefecture" text,
	"address" text,
	"lat" double precision,
	"lng" double precision,
	"price_info" text,
	"image_url" text,
	"summary" text,
	"source" text,
	"source_id" text,
	"rating" double precision,
	"user_ratings_total" integer,
	"types" text[],
	"photo_ref" text,
	"last_refreshed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "places_place_id_unique" UNIQUE("place_id"),
	CONSTRAINT "places_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"place_id" text NOT NULL,
	"note" text,
	"score" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_place_id_places_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("place_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_places_place_id" ON "places" USING btree ("place_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_wishlists_user_place" ON "wishlists" USING btree ("user_id","place_id");