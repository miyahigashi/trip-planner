ALTER TABLE "users" ADD COLUMN "handle" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_users_handle_ci" ON "users" USING btree (lower("handle")) WHERE "users"."handle" is not null;