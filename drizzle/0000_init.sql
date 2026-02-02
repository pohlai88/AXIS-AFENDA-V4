-- AFENDA init migration (Neon Auth + business tables)
-- - Auth schema (neon_auth.*) is managed by Neon Auth.
-- - Public schema contains only business tables + app-owned profile/preferences.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ---------- Roles (recommended for RLS enforcement) ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOINHERIT;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO app_user;

-- ---------- Helper functions for RLS ----------
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_user_id() IS NOT NULL
$$;

-- ---------- Core tables ----------

CREATE TABLE IF NOT EXISTS public.neon_user_profiles (
  user_id uuid PRIMARY KEY REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  email varchar(255) NOT NULL,
  display_name varchar(255),
  avatar varchar(500),
  role varchar(50) NOT NULL DEFAULT 'user',
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS neon_user_profiles_email_idx ON public.neon_user_profiles(email);
CREATE INDEX IF NOT EXISTS neon_user_profiles_role_idx ON public.neon_user_profiles(role);

CREATE TABLE IF NOT EXISTS public.neon_login_attempts (
  id serial PRIMARY KEY,
  identifier text NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS neon_login_attempts_identifier_idx ON public.neon_login_attempts(identifier);
CREATE INDEX IF NOT EXISTS neon_login_attempts_locked_idx ON public.neon_login_attempts(locked_until);

CREATE TABLE IF NOT EXISTS public.neon_unlock_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_hash varchar(64) NOT NULL,
  token varchar(255) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS neon_unlock_tokens_identifier_hash_idx ON public.neon_unlock_tokens(identifier_hash);
CREATE INDEX IF NOT EXISTS neon_unlock_tokens_expires_at_idx ON public.neon_unlock_tokens(expires_at);

CREATE TABLE IF NOT EXISTS public.neon_security_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES neon_auth."user"(id) ON DELETE SET NULL,
  action varchar(50) NOT NULL,
  success boolean NOT NULL DEFAULT false,
  identifier_hash varchar(64),
  identifier_type varchar(32),
  request_id varchar(100),
  ip_address varchar(45),
  user_agent varchar(500),
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS neon_security_event_log_action_idx ON public.neon_security_event_log(action);
CREATE INDEX IF NOT EXISTS neon_security_event_log_created_at_idx ON public.neon_security_event_log(created_at);
CREATE INDEX IF NOT EXISTS neon_security_event_log_identifier_hash_idx ON public.neon_security_event_log(identifier_hash);

CREATE TABLE IF NOT EXISTS public.neon_user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  action varchar(50) NOT NULL,
  resource varchar(100),
  resource_id varchar(255),
  ip_address varchar(45),
  user_agent varchar(500),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS neon_user_activity_log_user_id_idx ON public.neon_user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS neon_user_activity_log_action_idx ON public.neon_user_activity_log(action);
CREATE INDEX IF NOT EXISTS neon_user_activity_log_created_at_idx ON public.neon_user_activity_log(created_at);

CREATE TABLE IF NOT EXISTS public.neon_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  description text,
  logo varchar(500),
  settings jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES neon_auth."user"(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS neon_organizations_slug_idx ON public.neon_organizations(slug);
CREATE INDEX IF NOT EXISTS neon_organizations_name_idx ON public.neon_organizations(name);
CREATE INDEX IF NOT EXISTS neon_organizations_is_active_idx ON public.neon_organizations(is_active);

CREATE TABLE IF NOT EXISTS public.neon_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.neon_organizations(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  slug varchar(100) NOT NULL,
  description text,
  parent_id uuid REFERENCES public.neon_teams(id) ON DELETE SET NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teams_unique_slug UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS neon_teams_organization_id_idx ON public.neon_teams(organization_id);
CREATE INDEX IF NOT EXISTS neon_teams_slug_idx ON public.neon_teams(slug);
CREATE INDEX IF NOT EXISTS neon_teams_parent_id_idx ON public.neon_teams(parent_id);
CREATE INDEX IF NOT EXISTS neon_teams_is_active_idx ON public.neon_teams(is_active);

CREATE TABLE IF NOT EXISTS public.neon_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.neon_organizations(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.neon_teams(id) ON DELETE CASCADE,
  role varchar(50) NOT NULL DEFAULT 'member',
  permissions jsonb DEFAULT '{}'::jsonb,
  invited_by uuid REFERENCES neon_auth."user"(id) ON DELETE SET NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memberships_unique UNIQUE (user_id, organization_id, team_id)
);

CREATE INDEX IF NOT EXISTS neon_memberships_user_id_idx ON public.neon_memberships(user_id);
CREATE INDEX IF NOT EXISTS neon_memberships_organization_id_idx ON public.neon_memberships(organization_id);
CREATE INDEX IF NOT EXISTS neon_memberships_team_id_idx ON public.neon_memberships(team_id);
CREATE INDEX IF NOT EXISTS neon_memberships_role_idx ON public.neon_memberships(role);
CREATE INDEX IF NOT EXISTS neon_memberships_is_active_idx ON public.neon_memberships(is_active);

CREATE TABLE IF NOT EXISTS public.neon_resource_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type varchar(50) NOT NULL,
  resource_id uuid NOT NULL,
  owner_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  shared_with_user_id uuid REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  shared_with_team_id uuid REFERENCES public.neon_teams(id) ON DELETE CASCADE,
  shared_with_organization_id uuid REFERENCES public.neon_organizations(id) ON DELETE CASCADE,
  permissions jsonb NOT NULL DEFAULT '{"read":true,"write":false,"admin":false}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS neon_resource_shares_resource_id_idx ON public.neon_resource_shares(resource_id);
CREATE INDEX IF NOT EXISTS neon_resource_shares_owner_id_idx ON public.neon_resource_shares(owner_id);
CREATE INDEX IF NOT EXISTS neon_resource_shares_shared_with_user_idx ON public.neon_resource_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS neon_resource_shares_shared_with_team_idx ON public.neon_resource_shares(shared_with_team_id);
CREATE INDEX IF NOT EXISTS neon_resource_shares_shared_with_org_idx ON public.neon_resource_shares(shared_with_organization_id);
CREATE INDEX IF NOT EXISTS neon_resource_shares_expires_at_idx ON public.neon_resource_shares(expires_at);
CREATE INDEX IF NOT EXISTS neon_resource_shares_unique
  ON public.neon_resource_shares(resource_type, resource_id, shared_with_user_id, shared_with_team_id, shared_with_organization_id);

CREATE TABLE IF NOT EXISTS public.neon_subdomain_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain varchar(63) NOT NULL UNIQUE,
  organization_id uuid NOT NULL REFERENCES public.neon_organizations(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.neon_teams(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_primary boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE RESTRICT,
  customization jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS neon_subdomain_config_org_id_idx ON public.neon_subdomain_config(organization_id);
CREATE INDEX IF NOT EXISTS neon_subdomain_config_subdomain_idx ON public.neon_subdomain_config(subdomain);
CREATE INDEX IF NOT EXISTS neon_subdomain_config_is_active_idx ON public.neon_subdomain_config(is_active);
CREATE INDEX IF NOT EXISTS neon_subdomain_config_is_primary_idx ON public.neon_subdomain_config(is_primary, organization_id);

CREATE TABLE IF NOT EXISTS public.neon_tenant_design_system (
  tenant_id text PRIMARY KEY,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.neon_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  color varchar(7),
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Back-compat: if the table existed before org scoping, add the column + FK.
ALTER TABLE public.neon_projects
  ADD COLUMN IF NOT EXISTS organization_id uuid;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'neon_projects_organization_id_fkey'
  ) THEN
    ALTER TABLE public.neon_projects
      ADD CONSTRAINT neon_projects_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.neon_organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS neon_projects_user_id_idx ON public.neon_projects(user_id);
CREATE INDEX IF NOT EXISTS neon_projects_organization_id_idx ON public.neon_projects(organization_id);
CREATE INDEX IF NOT EXISTS neon_projects_archived_idx ON public.neon_projects(archived);

CREATE TABLE IF NOT EXISTS public.neon_recurrence_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  frequency varchar(20) NOT NULL,
  interval integer NOT NULL DEFAULT 1,
  days_of_week jsonb DEFAULT '[]'::jsonb,
  days_of_month jsonb DEFAULT '[]'::jsonb,
  end_date timestamptz,
  max_occurrences integer,
  occurrence_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.neon_recurrence_rules
  ADD COLUMN IF NOT EXISTS organization_id uuid;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'neon_recurrence_rules_organization_id_fkey'
  ) THEN
    ALTER TABLE public.neon_recurrence_rules
      ADD CONSTRAINT neon_recurrence_rules_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.neon_organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS neon_recurrence_rules_user_id_idx ON public.neon_recurrence_rules(user_id);
CREATE INDEX IF NOT EXISTS neon_recurrence_rules_organization_id_idx ON public.neon_recurrence_rules(organization_id);

CREATE TABLE IF NOT EXISTS public.neon_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.neon_projects(id) ON DELETE SET NULL,
  parent_task_id uuid REFERENCES public.neon_tasks(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  description text,
  status varchar(20) NOT NULL DEFAULT 'todo',
  priority varchar(10) NOT NULL DEFAULT 'medium',
  due_date timestamptz,
  completed_at timestamptz,
  tags jsonb DEFAULT '[]'::jsonb,
  recurrence_rule_id uuid REFERENCES public.neon_recurrence_rules(id) ON DELETE SET NULL,
  is_recurrence_child boolean NOT NULL DEFAULT false,
  parent_recurrence_task_id uuid,
  next_occurrence_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.neon_tasks
  ADD COLUMN IF NOT EXISTS organization_id uuid;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'neon_tasks_organization_id_fkey'
  ) THEN
    ALTER TABLE public.neon_tasks
      ADD CONSTRAINT neon_tasks_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.neon_organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS neon_tasks_user_id_idx ON public.neon_tasks(user_id);
CREATE INDEX IF NOT EXISTS neon_tasks_organization_id_idx ON public.neon_tasks(organization_id);
CREATE INDEX IF NOT EXISTS neon_tasks_project_id_idx ON public.neon_tasks(project_id);
CREATE INDEX IF NOT EXISTS neon_tasks_status_idx ON public.neon_tasks(status);
CREATE INDEX IF NOT EXISTS neon_tasks_due_date_idx ON public.neon_tasks(due_date);
CREATE INDEX IF NOT EXISTS neon_tasks_priority_idx ON public.neon_tasks(priority);

CREATE TABLE IF NOT EXISTS public.neon_task_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.neon_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  action varchar(50) NOT NULL,
  previous_values jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.neon_task_history
  ADD COLUMN IF NOT EXISTS organization_id uuid;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'neon_task_history_organization_id_fkey'
  ) THEN
    ALTER TABLE public.neon_task_history
      ADD CONSTRAINT neon_task_history_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.neon_organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS neon_task_history_task_id_idx ON public.neon_task_history(task_id);
CREATE INDEX IF NOT EXISTS neon_task_history_user_id_idx ON public.neon_task_history(user_id);
CREATE INDEX IF NOT EXISTS neon_task_history_organization_id_idx ON public.neon_task_history(organization_id);

-- ---------- Grants ----------
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

-- Sequences (needed for SERIAL/identity columns)
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_user;

-- ---------- RLS (recommended) ----------
-- NOTE: To *enforce* RLS, connect your application using the `app_user` role.
--       (Table owners bypass RLS unless FORCE is enabled; we avoid FORCE to keep admin/migrations simple.)

-- Policy reset (idempotent): allow re-running this migration safely.
DROP POLICY IF EXISTS neon_user_profiles_self ON public.neon_user_profiles;
DROP POLICY IF EXISTS neon_projects_self ON public.neon_projects;
DROP POLICY IF EXISTS neon_tasks_self ON public.neon_tasks;
DROP POLICY IF EXISTS neon_recurrence_rules_self ON public.neon_recurrence_rules;
DROP POLICY IF EXISTS neon_task_history_self ON public.neon_task_history;
DROP POLICY IF EXISTS neon_user_activity_log_self ON public.neon_user_activity_log;

DROP POLICY IF EXISTS neon_organizations_member_read ON public.neon_organizations;
DROP POLICY IF EXISTS neon_organizations_create ON public.neon_organizations;
DROP POLICY IF EXISTS neon_organizations_owner_update ON public.neon_organizations;
DROP POLICY IF EXISTS neon_organizations_owner_delete ON public.neon_organizations;

DROP POLICY IF EXISTS neon_teams_member_read ON public.neon_teams;
DROP POLICY IF EXISTS neon_teams_owner_insert ON public.neon_teams;
DROP POLICY IF EXISTS neon_teams_owner_update ON public.neon_teams;
DROP POLICY IF EXISTS neon_teams_owner_delete ON public.neon_teams;

DROP POLICY IF EXISTS neon_memberships_self_read ON public.neon_memberships;
DROP POLICY IF EXISTS neon_memberships_owner_insert ON public.neon_memberships;
DROP POLICY IF EXISTS neon_memberships_owner_update ON public.neon_memberships;
DROP POLICY IF EXISTS neon_memberships_owner_delete ON public.neon_memberships;

DROP POLICY IF EXISTS neon_subdomain_member_read ON public.neon_subdomain_config;
DROP POLICY IF EXISTS neon_subdomain_owner_insert ON public.neon_subdomain_config;
DROP POLICY IF EXISTS neon_subdomain_owner_update ON public.neon_subdomain_config;
DROP POLICY IF EXISTS neon_subdomain_owner_delete ON public.neon_subdomain_config;

DROP POLICY IF EXISTS neon_shares_read ON public.neon_resource_shares;
DROP POLICY IF EXISTS neon_shares_owner_insert ON public.neon_resource_shares;
DROP POLICY IF EXISTS neon_shares_owner_update ON public.neon_resource_shares;
DROP POLICY IF EXISTS neon_shares_owner_delete ON public.neon_resource_shares;

ALTER TABLE public.neon_user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY neon_user_profiles_self ON public.neon_user_profiles
  FOR ALL TO app_user
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

ALTER TABLE public.neon_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY neon_projects_self ON public.neon_projects
  FOR ALL TO app_user
  USING (
    user_id = public.current_user_id()
    AND (
      organization_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.neon_memberships m
        WHERE m.organization_id = neon_projects.organization_id
          AND m.user_id = public.current_user_id()
          AND m.is_active = true
      )
    )
  )
  WITH CHECK (
    user_id = public.current_user_id()
    AND (
      organization_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.neon_memberships m
        WHERE m.organization_id = neon_projects.organization_id
          AND m.user_id = public.current_user_id()
          AND m.is_active = true
      )
    )
  );

ALTER TABLE public.neon_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY neon_tasks_self ON public.neon_tasks
  FOR ALL TO app_user
  USING (
    user_id = public.current_user_id()
    AND (
      organization_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.neon_memberships m
        WHERE m.organization_id = neon_tasks.organization_id
          AND m.user_id = public.current_user_id()
          AND m.is_active = true
      )
    )
  )
  WITH CHECK (
    user_id = public.current_user_id()
    AND (
      organization_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.neon_memberships m
        WHERE m.organization_id = neon_tasks.organization_id
          AND m.user_id = public.current_user_id()
          AND m.is_active = true
      )
    )
  );

ALTER TABLE public.neon_recurrence_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY neon_recurrence_rules_self ON public.neon_recurrence_rules
  FOR ALL TO app_user
  USING (
    user_id = public.current_user_id()
    AND (
      organization_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.neon_memberships m
        WHERE m.organization_id = neon_recurrence_rules.organization_id
          AND m.user_id = public.current_user_id()
          AND m.is_active = true
      )
    )
  )
  WITH CHECK (
    user_id = public.current_user_id()
    AND (
      organization_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.neon_memberships m
        WHERE m.organization_id = neon_recurrence_rules.organization_id
          AND m.user_id = public.current_user_id()
          AND m.is_active = true
      )
    )
  );

ALTER TABLE public.neon_task_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY neon_task_history_self ON public.neon_task_history
  FOR ALL TO app_user
  USING (
    user_id = public.current_user_id()
    AND (
      organization_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.neon_memberships m
        WHERE m.organization_id = neon_task_history.organization_id
          AND m.user_id = public.current_user_id()
          AND m.is_active = true
      )
    )
  )
  WITH CHECK (
    user_id = public.current_user_id()
    AND (
      organization_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.neon_memberships m
        WHERE m.organization_id = neon_task_history.organization_id
          AND m.user_id = public.current_user_id()
          AND m.is_active = true
      )
    )
  );

ALTER TABLE public.neon_user_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY neon_user_activity_log_self ON public.neon_user_activity_log
  FOR ALL TO app_user
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

-- Organizations/teams/memberships: membership-based access
ALTER TABLE public.neon_organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY neon_organizations_member_read ON public.neon_organizations
  FOR SELECT TO app_user
  USING (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = id
        AND m.user_id = public.current_user_id()
        AND m.is_active = true
    )
  );
CREATE POLICY neon_organizations_create ON public.neon_organizations
  FOR INSERT TO app_user
  WITH CHECK (public.is_authenticated());
CREATE POLICY neon_organizations_owner_update ON public.neon_organizations
  FOR UPDATE TO app_user
  USING (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = id
        AND m.user_id = public.current_user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = id
        AND m.user_id = public.current_user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )
  );
CREATE POLICY neon_organizations_owner_delete ON public.neon_organizations
  FOR DELETE TO app_user
  USING (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = id
        AND m.user_id = public.current_user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )
  );

ALTER TABLE public.neon_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY neon_teams_member_read ON public.neon_teams
  FOR SELECT TO app_user
  USING (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = organization_id
        AND m.user_id = public.current_user_id()
        AND m.is_active = true
    )
  );
CREATE POLICY neon_teams_owner_insert ON public.neon_teams
  FOR INSERT TO app_user
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = organization_id
        AND m.user_id = public.current_user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )
  );
CREATE POLICY neon_teams_owner_update ON public.neon_teams
  FOR UPDATE TO app_user
  USING (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = organization_id
        AND m.user_id = public.current_user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = organization_id
        AND m.user_id = public.current_user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )
  );
CREATE POLICY neon_teams_owner_delete ON public.neon_teams
  FOR DELETE TO app_user
  USING (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = organization_id
        AND m.user_id = public.current_user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )
  );

ALTER TABLE public.neon_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY neon_memberships_self_read ON public.neon_memberships
  FOR SELECT TO app_user
  USING (
    user_id = public.current_user_id()
    OR EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = organization_id
        AND m.user_id = public.current_user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )
  );
CREATE POLICY neon_memberships_owner_insert ON public.neon_memberships
  FOR INSERT TO app_user
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = organization_id
        AND m.user_id = public.current_user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )
  );
CREATE POLICY neon_memberships_owner_update ON public.neon_memberships
  FOR UPDATE TO app_user
  USING (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = organization_id
        AND m.user_id = public.current_user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = organization_id
        AND m.user_id = public.current_user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )
  );
CREATE POLICY neon_memberships_owner_delete ON public.neon_memberships
  FOR DELETE TO app_user
  USING (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = organization_id
        AND m.user_id = public.current_user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )
  );

ALTER TABLE public.neon_subdomain_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY neon_subdomain_member_read ON public.neon_subdomain_config
  FOR SELECT TO app_user
  USING (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = organization_id
        AND m.user_id = public.current_user_id()
        AND m.is_active = true
    )
  );
CREATE POLICY neon_subdomain_owner_insert ON public.neon_subdomain_config
  FOR INSERT TO app_user
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = organization_id
        AND m.user_id = public.current_user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )
  );
CREATE POLICY neon_subdomain_owner_update ON public.neon_subdomain_config
  FOR UPDATE TO app_user
  USING (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = organization_id
        AND m.user_id = public.current_user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = organization_id
        AND m.user_id = public.current_user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )
  );
CREATE POLICY neon_subdomain_owner_delete ON public.neon_subdomain_config
  FOR DELETE TO app_user
  USING (
    EXISTS (
      SELECT 1
      FROM public.neon_memberships m
      WHERE m.organization_id = organization_id
        AND m.user_id = public.current_user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )
  );

ALTER TABLE public.neon_resource_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY neon_shares_read ON public.neon_resource_shares
  FOR SELECT TO app_user
  USING (
    owner_id = public.current_user_id()
    OR shared_with_user_id = public.current_user_id()
  );
CREATE POLICY neon_shares_owner_insert ON public.neon_resource_shares
  FOR INSERT TO app_user
  WITH CHECK (owner_id = public.current_user_id());
CREATE POLICY neon_shares_owner_update ON public.neon_resource_shares
  FOR UPDATE TO app_user
  USING (owner_id = public.current_user_id())
  WITH CHECK (owner_id = public.current_user_id());
CREATE POLICY neon_shares_owner_delete ON public.neon_resource_shares
  FOR DELETE TO app_user
  USING (owner_id = public.current_user_id());

