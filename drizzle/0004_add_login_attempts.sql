CREATE TABLE IF NOT EXISTS "login_attempts" (
  "id" SERIAL PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "window_start" TIMESTAMPTZ NOT NULL,
  "locked_until" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "login_attempts_identifier_idx"
  ON "login_attempts" ("identifier");

CREATE INDEX IF NOT EXISTS "login_attempts_locked_idx"
  ON "login_attempts" ("locked_until")
  WHERE "locked_until" IS NOT NULL;
