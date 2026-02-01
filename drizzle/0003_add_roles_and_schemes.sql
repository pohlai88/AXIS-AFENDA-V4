-- Migration: Add roles and permission schemes tables
-- Following the hybrid methodology for Mattermost-inspired roles and Nextcloud-inspired schemes

-- Add createdBy to organizations table
ALTER TABLE "organizations" ADD COLUMN "created_by" UUID REFERENCES "users"("id") ON DELETE SET NULL;

-- Create roles table (Mattermost-inspired)
CREATE TABLE IF NOT EXISTS "roles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) UNIQUE NOT NULL,
  "display_name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "permissions" JSONB NOT NULL DEFAULT '{}',
  "is_system" BOOLEAN DEFAULT FALSE,
  "hierarchy_level" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create permission schemes table (Nextcloud-inspired)
CREATE TABLE IF NOT EXISTS "permission_schemes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "type" VARCHAR(50) NOT NULL, -- system, organization, team
  "scope_id" UUID, -- org_id or team_id
  "permissions" JSONB NOT NULL DEFAULT '{}',
  "is_default" BOOLEAN DEFAULT FALSE,
  "is_active" BOOLEAN DEFAULT TRUE,
  "created_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for roles
CREATE INDEX IF NOT EXISTS "roles_name_idx" ON "roles"("name");
CREATE INDEX IF NOT EXISTS "roles_is_system_idx" ON "roles"("is_system");
CREATE INDEX IF NOT EXISTS "roles_hierarchy_level_idx" ON "roles"("hierarchy_level");

-- Create indexes for permission schemes
CREATE INDEX IF NOT EXISTS "permission_schemes_type_idx" ON "permission_schemes"("type");
CREATE INDEX IF NOT EXISTS "permission_schemes_scope_id_idx" ON "permission_schemes"("scope_id");
CREATE INDEX IF NOT EXISTS "permission_schemes_is_default_idx" ON "permission_schemes"("is_default");
CREATE INDEX IF NOT EXISTS "permission_schemes_is_active_idx" ON "permission_schemes"("is_active");

-- Insert default system roles (Mattermost-inspired hierarchy)
INSERT INTO "roles" ("name", "display_name", "description", "permissions", "is_system", "hierarchy_level") VALUES
  ('system_admin', 'System Administrator', 'Full system access', '{"system:admin": true, "system:user:manage": true}', true, 100),
  ('org_owner', 'Organization Owner', 'Full organization control', '{"organization:manage": true, "organization:delete": true}', true, 90),
  ('org_admin', 'Organization Admin', 'Organization administration', '{"organization:manage": true, "organization:member:manage": true}', true, 80),
  ('org_member', 'Organization Member', 'Basic organization access', '{"organization:read": true, "team:create": true}', true, 50),
  ('team_manager', 'Team Manager', 'Full team control', '{"team:manage": true, "team:member:manage": true}', true, 70),
  ('team_member', 'Team Member', 'Basic team access', '{"team:read": true, "project:create": true}', true, 40)
ON CONFLICT (name) DO NOTHING;

-- Insert default permission schemes (Nextcloud-inspired)
INSERT INTO "permission_schemes" ("name", "description", "type", "permissions", "is_default", "is_active") VALUES
  ('Default System Scheme', 'Default permissions for all users', 'system', '{"task:create": true, "task:read": true, "project:create": true, "project:read": true}', true, true),
  ('Default Organization Scheme', 'Default permissions for organization members', 'organization', '{"organization:read": true, "team:create": true, "project:create": true}', true, true),
  ('Default Team Scheme', 'Default permissions for team members', 'team', '{"team:read": true, "project:create": true, "task:create": true}', true, true)
ON CONFLICT DO NOTHING;
