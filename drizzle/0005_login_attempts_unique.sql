-- Concurrency hardening for login rate limiting
-- Ensure one row per identifier to allow atomic UPSERT increments.

-- Deduplicate existing rows (keep the newest per identifier).
WITH ranked AS (
  SELECT
    id,
    identifier,
    ROW_NUMBER() OVER (PARTITION BY identifier ORDER BY updated_at DESC NULLS LAST, id DESC) AS rn
  FROM public.neon_login_attempts
)
DELETE FROM public.neon_login_attempts a
USING ranked r
WHERE a.id = r.id AND r.rn > 1;

-- Unique index for atomic upserts.
CREATE UNIQUE INDEX IF NOT EXISTS neon_login_attempts_identifier_uniq
  ON public.neon_login_attempts(identifier);

