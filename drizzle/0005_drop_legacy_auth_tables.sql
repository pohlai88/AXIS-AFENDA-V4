-- Drop legacy authentication tables
-- These tables are now managed by Neon Auth service (neon_auth.* schema)
-- This migration cleans up duplicate tables and consolidates auth to Neon Auth

-- Step 1: Drop tables that duplicate Neon Auth functionality
DROP TABLE IF EXISTS "password_reset_tokens" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "accounts" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "verification_tokens" CASCADE;

-- Step 2: Verify Neon Auth schema exists
-- The following tables should exist in neon_auth schema:
-- - neon_auth.user
-- - neon_auth.session
-- - neon_auth.account
-- - neon_auth.verification
-- - neon_auth.organization
-- - neon_auth.member
-- - neon_auth.invitation
-- - neon_auth.jwks
-- - neon_auth.project_config
--
-- If any of these are missing, provision Neon Auth before applying this migration

-- Step 3: Confirmation
-- Application should now only use:
-- - neon_auth.user for user data
-- - neon_auth.session for session management
-- - neon_auth.account for OAuth accounts
-- - neon_auth.verification for email verification tokens
-- - Custom tables in public schema for business logic (tasks, projects, etc.)
