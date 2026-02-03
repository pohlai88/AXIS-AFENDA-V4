-- Security tables RLS (login protection)
--
-- These tables are written during unauthenticated flows (rate limiting, unlock tokens),
-- so policies must NOT rely on `app.user_id`.
--
-- We still restrict access to the application role (`app_user`) via RLS `TO app_user`.

-- ---------- neon_login_attempts ----------
ALTER TABLE public.neon_login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS neon_login_attempts_app ON public.neon_login_attempts;
CREATE POLICY neon_login_attempts_app ON public.neon_login_attempts
  FOR ALL TO app_user
  USING (true)
  WITH CHECK (true);

-- ---------- neon_unlock_tokens ----------
ALTER TABLE public.neon_unlock_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS neon_unlock_tokens_app ON public.neon_unlock_tokens;
CREATE POLICY neon_unlock_tokens_app ON public.neon_unlock_tokens
  FOR ALL TO app_user
  USING (true)
  WITH CHECK (true);

