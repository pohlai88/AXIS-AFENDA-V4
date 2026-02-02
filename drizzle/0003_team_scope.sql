-- AFENDA team scoping (optional tenant hardening)
-- Adds team_id columns to core user-owned tables and tightens RLS to require
-- team membership when team_id is set. Existing rows remain valid (team_id NULL).

-- 1) Columns
ALTER TABLE public.neon_projects
  ADD COLUMN IF NOT EXISTS team_id uuid;

ALTER TABLE public.neon_recurrence_rules
  ADD COLUMN IF NOT EXISTS team_id uuid;

ALTER TABLE public.neon_tasks
  ADD COLUMN IF NOT EXISTS team_id uuid;

ALTER TABLE public.neon_task_history
  ADD COLUMN IF NOT EXISTS team_id uuid;

-- 2) Foreign keys (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'neon_projects_team_id_fkey'
  ) THEN
    ALTER TABLE public.neon_projects
      ADD CONSTRAINT neon_projects_team_id_fkey
      FOREIGN KEY (team_id) REFERENCES public.neon_teams(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'neon_recurrence_rules_team_id_fkey'
  ) THEN
    ALTER TABLE public.neon_recurrence_rules
      ADD CONSTRAINT neon_recurrence_rules_team_id_fkey
      FOREIGN KEY (team_id) REFERENCES public.neon_teams(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'neon_tasks_team_id_fkey'
  ) THEN
    ALTER TABLE public.neon_tasks
      ADD CONSTRAINT neon_tasks_team_id_fkey
      FOREIGN KEY (team_id) REFERENCES public.neon_teams(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'neon_task_history_team_id_fkey'
  ) THEN
    ALTER TABLE public.neon_task_history
      ADD CONSTRAINT neon_task_history_team_id_fkey
      FOREIGN KEY (team_id) REFERENCES public.neon_teams(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3) Indexes
CREATE INDEX IF NOT EXISTS neon_projects_team_id_idx ON public.neon_projects(team_id);
CREATE INDEX IF NOT EXISTS neon_recurrence_rules_team_id_idx ON public.neon_recurrence_rules(team_id);
CREATE INDEX IF NOT EXISTS neon_tasks_team_id_idx ON public.neon_tasks(team_id);
CREATE INDEX IF NOT EXISTS neon_task_history_team_id_idx ON public.neon_task_history(team_id);

-- 4) Tighten RLS policies (drop + recreate)
-- Require:
-- - user_id matches current user
-- - if organization_id is set, user is a member of that org
-- - if team_id is set, user is an active member of that team

DROP POLICY IF EXISTS neon_projects_self ON public.neon_projects;
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
    AND (
      team_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.neon_memberships m
        WHERE m.team_id = neon_projects.team_id
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
    AND (
      team_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.neon_memberships m
        WHERE m.team_id = neon_projects.team_id
          AND m.user_id = public.current_user_id()
          AND m.is_active = true
      )
    )
  );

DROP POLICY IF EXISTS neon_tasks_self ON public.neon_tasks;
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
    AND (
      team_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.neon_memberships m
        WHERE m.team_id = neon_tasks.team_id
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
    AND (
      team_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.neon_memberships m
        WHERE m.team_id = neon_tasks.team_id
          AND m.user_id = public.current_user_id()
          AND m.is_active = true
      )
    )
  );

DROP POLICY IF EXISTS neon_recurrence_rules_self ON public.neon_recurrence_rules;
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
    AND (
      team_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.neon_memberships m
        WHERE m.team_id = neon_recurrence_rules.team_id
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
    AND (
      team_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.neon_memberships m
        WHERE m.team_id = neon_recurrence_rules.team_id
          AND m.user_id = public.current_user_id()
          AND m.is_active = true
      )
    )
  );

DROP POLICY IF EXISTS neon_task_history_self ON public.neon_task_history;
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
    AND (
      team_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.neon_memberships m
        WHERE m.team_id = neon_task_history.team_id
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
    AND (
      team_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.neon_memberships m
        WHERE m.team_id = neon_task_history.team_id
          AND m.user_id = public.current_user_id()
          AND m.is_active = true
      )
    )
  );

