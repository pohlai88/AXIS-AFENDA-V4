-- Harden tenant subdomain mapping (Neon best practice)
--
-- Goals:
-- - Members can read subdomain mappings for orgs they belong to
-- - Only org owners/admins can create/update/delete mappings
-- - Prevent "moving" a mapping across orgs (organization_id immutable)
-- - Prevent changing the subdomain string after creation (subdomain immutable)
-- - Prevent forging created_by (must be current_user_id() on insert; immutable after)

-- 1) Replace RLS policies (idempotent)
DROP POLICY IF EXISTS neon_subdomain_member_read ON public.neon_subdomain_config;
DROP POLICY IF EXISTS neon_subdomain_owner_insert ON public.neon_subdomain_config;
DROP POLICY IF EXISTS neon_subdomain_owner_update ON public.neon_subdomain_config;
DROP POLICY IF EXISTS neon_subdomain_owner_delete ON public.neon_subdomain_config;

ALTER TABLE public.neon_subdomain_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY neon_subdomain_member_read ON public.neon_subdomain_config
  FOR SELECT TO app_user
  USING (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = neon_subdomain_config.organization_id
        AND m.user_id = public.current_user_id()
        AND m.is_active = true
    )
  );

CREATE POLICY neon_subdomain_owner_insert ON public.neon_subdomain_config
  FOR INSERT TO app_user
  WITH CHECK (
    created_by = public.current_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = neon_subdomain_config.organization_id
        AND m.user_id = public.current_user_id()
        AND m.role IN ('owner', 'admin')
        AND m.is_active = true
    )
  );

CREATE POLICY neon_subdomain_owner_update ON public.neon_subdomain_config
  FOR UPDATE TO app_user
  USING (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = neon_subdomain_config.organization_id
        AND m.user_id = public.current_user_id()
        AND m.role IN ('owner', 'admin')
        AND m.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = neon_subdomain_config.organization_id
        AND m.user_id = public.current_user_id()
        AND m.role IN ('owner', 'admin')
        AND m.is_active = true
    )
  );

CREATE POLICY neon_subdomain_owner_delete ON public.neon_subdomain_config
  FOR DELETE TO app_user
  USING (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = neon_subdomain_config.organization_id
        AND m.user_id = public.current_user_id()
        AND m.role IN ('owner', 'admin')
        AND m.is_active = true
    )
  );

-- 2) Prevent dangerous updates regardless of app bugs (immutable fields)
CREATE OR REPLACE FUNCTION public.neon_subdomain_config_enforce_immutable_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'organization_id is immutable';
  END IF;
  IF NEW.subdomain IS DISTINCT FROM OLD.subdomain THEN
    RAISE EXCEPTION 'subdomain is immutable';
  END IF;
  IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'created_by is immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS neon_subdomain_config_immutable_fields ON public.neon_subdomain_config;
CREATE TRIGGER neon_subdomain_config_immutable_fields
  BEFORE UPDATE ON public.neon_subdomain_config
  FOR EACH ROW
  EXECUTE FUNCTION public.neon_subdomain_config_enforce_immutable_fields();

