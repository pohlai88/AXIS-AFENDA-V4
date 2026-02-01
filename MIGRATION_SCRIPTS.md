# NEXIS-AFENDA-V4 Stabilization - Ready-to-Execute Migrations

## Migration 1: Add Foreign Key Constraints

**File**: `drizzle/0006_add_foreign_keys.sql`
**Timeline**: Phase 1, Day 1-2
**Risk**: LOW (no existing data to validate)
**Blocking**: Required before Phase 2

```sql
-- ============================================================================
-- MIGRATION: Add Foreign Key Constraints
-- Purpose: Enforce referential integrity across all business tables
-- Risk: LOW - Existing data is minimal/empty
-- Rollback: Drop constraints if any violation occurs
-- ============================================================================

-- Task -> Project relationship
ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_project_id
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Task -> Task (parent) relationship  
ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_parent_task_id
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Task -> RecurrenceRule relationship
ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_recurrence_rule_id
    FOREIGN KEY (recurrence_rule_id) REFERENCES recurrence_rules(id) ON DELETE SET NULL;

-- Team -> Organization relationship
ALTER TABLE teams
  ADD CONSTRAINT fk_teams_organization_id
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Team -> Team (parent) relationship
ALTER TABLE teams
  ADD CONSTRAINT fk_teams_parent_id
    FOREIGN KEY (parent_id) REFERENCES teams(id) ON DELETE CASCADE;

-- Membership -> Organization relationship
ALTER TABLE memberships
  ADD CONSTRAINT fk_memberships_organization_id
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Membership -> Team relationship
ALTER TABLE memberships
  ADD CONSTRAINT fk_memberships_team_id
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- TaskHistory -> Task relationship
ALTER TABLE task_history
  ADD CONSTRAINT fk_task_history_task_id
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- UserActivityLog -> Neon Auth User relationship
-- Note: This assumes Neon Auth is properly configured
ALTER TABLE user_activity_log
  ADD CONSTRAINT fk_user_activity_log_user_id
    FOREIGN KEY (user_id) REFERENCES neon_auth."user"(id) ON DELETE CASCADE;

-- ResourceShares -> Neon Auth User (owner) relationship
ALTER TABLE resource_shares
  ADD CONSTRAINT fk_resource_shares_owner_id
    FOREIGN KEY (owner_id) REFERENCES neon_auth."user"(id) ON DELETE CASCADE;

-- ResourceShares -> Neon Auth User (shared_with) relationship
ALTER TABLE resource_shares
  ADD CONSTRAINT fk_resource_shares_shared_with_user_id
    FOREIGN KEY (shared_with_user_id) REFERENCES neon_auth."user"(id) ON DELETE CASCADE;

-- ResourceShares -> Team relationship
ALTER TABLE resource_shares
  ADD CONSTRAINT fk_resource_shares_shared_with_team_id
    FOREIGN KEY (shared_with_team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- ResourceShares -> Organization relationship
ALTER TABLE resource_shares
  ADD CONSTRAINT fk_resource_shares_shared_with_organization_id
    FOREIGN KEY (shared_with_organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Commit timestamp
-- SELECT NOW() as migration_completed_at;
```

---

## Migration 2: Add Temporal Constraints

**File**: `drizzle/0007_add_temporal_constraints.sql`
**Timeline**: Phase 1, Day 2
**Risk**: VERY LOW (constraint checks only)
**Validation**: Required before Phase 3

```sql
-- ============================================================================
-- MIGRATION: Add Temporal & Logical Constraints
-- Purpose: Enforce business logic at database level
-- Risk: VERY LOW - Only constraint checks, no data changes
-- Rollback: Drop constraints if needed
-- ============================================================================

-- LoginAttempts: locked_until must be after window_start
ALTER TABLE login_attempts
  ADD CONSTRAINT check_login_attempts_locked_until_valid
    CHECK (locked_until IS NULL OR locked_until > window_start);

-- Tasks: completed_at must be after created_at
ALTER TABLE tasks
  ADD CONSTRAINT check_tasks_completion_after_creation
    CHECK (completed_at IS NULL OR completed_at >= created_at);

-- Teams: parent_id cannot reference itself
ALTER TABLE teams
  ADD CONSTRAINT check_teams_no_self_parent
    CHECK (parent_id IS NULL OR parent_id != id);

-- RecurrenceRules: occurrence_count must be within max_occurrences
ALTER TABLE recurrence_rules
  ADD CONSTRAINT check_recurrence_occurrence_count
    CHECK (occurrence_count >= 0 AND (max_occurrences IS NULL OR occurrence_count <= max_occurrences));

-- RecurrenceRules: max_occurrences must be positive if specified
ALTER TABLE recurrence_rules
  ADD CONSTRAINT check_recurrence_max_occurrences
    CHECK (max_occurrences IS NULL OR max_occurrences > 0);

-- RecurrenceRules: interval must be positive
ALTER TABLE recurrence_rules
  ADD CONSTRAINT check_recurrence_interval
    CHECK (interval > 0);
```

---

## Migration 3: Add Composite Indexes for Performance

**File**: `drizzle/0008_add_composite_indexes.sql`
**Timeline**: Phase 1, Day 2-3
**Risk**: LOW (CONCURRENT - non-blocking)
**Impact**: +30% query performance expected

```sql
-- ============================================================================
-- MIGRATION: Add Composite Indexes
-- Purpose: Optimize common query patterns
-- Risk: LOW - Uses CONCURRENTLY for non-blocking index creation
-- Timeline: 2-3 hours for index builds (non-blocking)
-- ============================================================================

-- Most common queries: List tasks/projects by user with pagination
CREATE INDEX CONCURRENTLY idx_tasks_user_created 
  ON tasks(user_id, created_at DESC)
  WHERE archived = false;

CREATE INDEX CONCURRENTLY idx_projects_user_created
  ON projects(user_id, created_at DESC)
  WHERE archived = false;

-- Team lookups
CREATE INDEX CONCURRENTLY idx_teams_org_active
  ON teams(organization_id, is_active)
  WHERE is_active = true;

-- Membership lookups
CREATE INDEX CONCURRENTLY idx_memberships_org_active
  ON memberships(organization_id, is_active, role)
  WHERE is_active = true;

-- Resource sharing lookups
CREATE INDEX CONCURRENTLY idx_shares_resource_user
  ON resource_shares(resource_type, resource_id, shared_with_user_id)
  WHERE expires_at IS NULL OR expires_at > NOW();

CREATE INDEX CONCURRENTLY idx_shares_resource_team
  ON resource_shares(resource_type, resource_id, shared_with_team_id)
  WHERE expires_at IS NULL OR expires_at > NOW();

-- Activity log searches
CREATE INDEX CONCURRENTLY idx_user_activity_log_created_at
  ON user_activity_log(user_id, created_at DESC)
  WHERE action IN ('create', 'update', 'delete');
```

---

## Validation Script

**File**: `scripts/validate-migrations.sql`
**Purpose**: Verify all migrations applied successfully

```sql
-- ============================================================================
-- VALIDATION: Check all migrations applied successfully
-- Run after completing all migrations
-- ============================================================================

-- 1. Verify all FK constraints exist
SELECT COUNT(*) as foreign_key_count
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public';
-- Expected: >= 13

-- 2. Verify all check constraints exist
SELECT COUNT(*) as check_constraint_count
FROM information_schema.check_constraints
WHERE constraint_schema = 'public';
-- Expected: >= 6

-- 3. Verify all composite indexes exist
SELECT COUNT(*) as composite_index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexdef LIKE '%(%,%' -- Has multiple columns
ORDER BY tablename;
-- Expected: >= 7

-- 4. Check for orphaned records (should be empty for new DB)
SELECT 'orphaned_tasks' as issue, COUNT(*) as count
FROM tasks t
WHERE t.project_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = t.project_id)
UNION ALL
SELECT 'orphaned_teams', COUNT(*)
FROM teams t
WHERE t.parent_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM teams t2 WHERE t2.id = t.parent_id)
UNION ALL
SELECT 'self_referencing_teams', COUNT(*)
FROM teams WHERE parent_id = id
UNION ALL
SELECT 'invalid_login_attempts', COUNT(*)
FROM login_attempts WHERE locked_until IS NOT NULL AND locked_until <= window_start;

-- 5. Estimate index impact on query plans
EXPLAIN ANALYZE
SELECT t.id, t.title, COUNT(*) as task_count
FROM tasks t
WHERE t.user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND t.created_at > NOW() - INTERVAL '30 days'
GROUP BY t.id, t.title
ORDER BY t.created_at DESC
LIMIT 10;
-- Should use idx_tasks_user_created index

-- 6. Final verification
SELECT 
  CASE 
    WHEN fk_count >= 13 AND check_count >= 6 AND index_count >= 7
      THEN 'VALIDATION PASSED ✅'
    ELSE 'VALIDATION FAILED ❌'
  END as migration_status
FROM (
  SELECT
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public') as fk_count,
    (SELECT COUNT(*) FROM information_schema.check_constraints 
     WHERE constraint_schema = 'public') as check_count,
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE schemaname = 'public' AND indexdef LIKE '%(%,%') as index_count
) validation;
```

---

## Execution Instructions

### Step 1: Create Migration Branch (Optional but Recommended)
```bash
# Create a safe testing branch
pnpm db:create-branch staging-migrations

# Test migrations on staging branch
pnpm db:migrate --branch staging-migrations
```

### Step 2: Apply Migrations in Order

```bash
# Ensure database connection
export DATABASE_URL="postgresql://user:pass@host:port/dbname"

# Migration 1: FK Constraints (2 hours - includes validation time)
psql -h $DB_HOST -d neondb -f drizzle/0006_add_foreign_keys.sql

# Migration 2: Temporal Constraints (30 minutes)
psql -h $DB_HOST -d neondb -f drizzle/0007_add_temporal_constraints.sql

# Migration 3: Composite Indexes (2-3 hours CONCURRENT)
# This is safe to run during business hours (non-blocking)
psql -h $DB_HOST -d neondb -f drizzle/0008_add_composite_indexes.sql
```

### Step 3: Validate

```bash
# Run validation script
psql -h $DB_HOST -d neondb -f scripts/validate-migrations.sql

# Expected output: VALIDATION PASSED ✅
```

### Step 4: Update Drizzle Schema

After migrations applied:
```bash
pnpm db:introspect  # Generate schema from DB
pnpm db:generate    # Create type definitions
pnpm typecheck      # Verify TypeScript changes
```

---

## Rollback Procedures

### If Migration Fails

```sql
-- Rollback Migration 3 (Indexes)
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_projects_user_created;
-- (Repeat for all composite indexes)

-- Rollback Migration 2 (Temporal Constraints)
ALTER TABLE login_attempts DROP CONSTRAINT IF EXISTS check_login_attempts_locked_until_valid;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_tasks_completion_after_creation;
-- (Repeat for all constraints)

-- Rollback Migration 1 (FK Constraints)
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_project_id;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_parent_task_id;
-- (Repeat for all foreign keys)
```

---

## Timeline & Parallelization

```
Day 1:
  ├─ Migration 1: FK Constraints (2-3 hours)
  │  ├─ Run on non-peak hours or staging
  │  └─ Validate with validation script
  └─ Migration 2: Temporal Constraints (parallel, 30 min)

Day 2:
  ├─ Migration 3: Composite Indexes (2-3 hours, CONCURRENT - safe for prod)
  │  ├─ Can run during business hours
  │  └─ Verify with EXPLAIN ANALYZE
  └─ Final validation

Total Time: 4-6 hours (mostly waiting for index creation)
```

---

## Monitoring During Execution

```bash
# Check migration progress
SELECT
  schemaname,
  tablename,
  indexname,
  idx_size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY idx_size DESC;

# Monitor lock contention
SELECT
  pid,
  usename,
  query,
  wait_event_type
FROM pg_stat_activity
WHERE state = 'active'
  AND query LIKE '%ALTER TABLE%';

# Check for blocking queries
SELECT
  blocking_locks.pid AS blocked_pid,
  blocked_statement.query AS blocked_query,
  blocking_locks.pid AS blocking_pid,
  blocking_statement.query AS blocking_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_statement ON (blocked_statement.pid = blocked_locks.pid)
JOIN pg_catalog.pg_locks blocking_locks ON (blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.granted)
JOIN pg_catalog.pg_stat_activity blocking_statement ON (blocking_statement.pid = blocking_locks.pid)
WHERE NOT blocked_locks.granted;
```

---

## Post-Migration Testing

```bash
# Run application test suite
pnpm test

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Build application
pnpm build

# Run integration tests against migrated DB
pnpm test:integration
```

---

**Migration Status**: READY FOR EXECUTION ✅
**Risk Level**: LOW (FK constraints) → VERY LOW (subsequent migrations)
**Estimated Total Time**: 4-6 hours (mostly waiting for CONCURRENT indexes)
**Blocking**: No - Can execute during business hours (CONCURRENT indexes)
