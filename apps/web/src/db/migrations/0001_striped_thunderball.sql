ALTER TABLE "places" ALTER COLUMN "lat" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "places" ALTER COLUMN "lng" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "wishlists" ALTER COLUMN "place_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "place_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "rating" double precision;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "user_ratings_total" integer;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "types" text[];--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "photo_ref" text;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_place_id_unique" UNIQUE("place_id");