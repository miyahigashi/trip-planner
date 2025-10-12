ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clerk_user_id" text;
ALTER TABLE "users" ALTER COLUMN "clerk_user_id" SET NOT NULL;