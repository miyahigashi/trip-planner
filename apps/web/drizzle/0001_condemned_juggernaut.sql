ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL;
ALTER TABLE "wishlists" ALTER COLUMN "created_at" SET NOT NULL;
-- ALTER TABLE "users" ADD COLUMN "clerk_user_id" text NOT NULL;

-- ここを修正
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_users_email" ON "users" USING btree ("email");

-- こちらは既にあってもOKだが、重複なら DO ブロックで保護すると安心
DO $$
BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id");
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'constraint users_clerk_user_id_unique already exists, skipping';
END $$;