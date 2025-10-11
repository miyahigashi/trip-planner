CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"prefecture" text,
	"address" text,
	"lat" text,
	"lng" text,
	"price_info" text,
	"image_url" text,
	"summary" text,
	"source" text,
	"source_id" text,
	"last_refreshed_at" timestamp with time zone,
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
	"place_id" uuid NOT NULL,
	"note" text,
	"score" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
