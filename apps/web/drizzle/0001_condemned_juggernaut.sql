ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wishlists" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "clerk_user_id" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_users_email" ON "users" USING btree ("email");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id");