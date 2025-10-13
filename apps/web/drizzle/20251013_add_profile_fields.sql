-- users にプロフィール系カラムを追加
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "handle" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_key" text;

-- 小文字化 handle のユニーク（NULL は対象外）
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_users_handle_ci"
  ON "users"(lower("handle"))
  WHERE "handle" IS NOT NULL;