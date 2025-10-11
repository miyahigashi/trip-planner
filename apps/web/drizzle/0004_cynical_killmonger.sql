ALTER TABLE "users" DROP CONSTRAINT "users_clerk_user_id_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "clerk_user_id" DROP NOT NULL;