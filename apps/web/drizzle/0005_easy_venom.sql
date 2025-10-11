CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"cover_photo_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "clerk_user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id");