-- 1) trips は既にある環境でもスキップさせる
CREATE TABLE IF NOT EXISTS "trips" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL,
  "title" text NOT NULL,
  "cover_photo_url" text,
  "status" text DEFAULT 'draft' NOT NULL,
  "tags" text[],
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- 2) NOT NULL は既に設定済みでもOK（エラーになりません）
ALTER TABLE "users" ALTER COLUMN "clerk_user_id" SET NOT NULL;

-- 3) UNIQUE 制約は重複時に落ちるので例外を握る
DO $$
BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id");
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'constraint users_clerk_user_id_unique already exists, skipping';
END $$;
