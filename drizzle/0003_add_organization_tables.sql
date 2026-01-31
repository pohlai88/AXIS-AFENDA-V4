-- Add organizations, teams, memberships, and resource sharing tables
-- This migration implements the hybrid methodology for organization-team-users features

-- ============ Organizations Table ============
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    logo VARCHAR(500),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for organizations
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS organizations_name_idx ON organizations(name);
CREATE INDEX IF NOT EXISTS organizations_is_active_idx ON organizations(is_active);

-- ============ Teams Table ============
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

-- Create indexes for teams
CREATE INDEX IF NOT EXISTS teams_organization_id_idx ON teams(organization_id);
CREATE INDEX IF NOT EXISTS teams_slug_idx ON teams(slug);
CREATE INDEX IF NOT EXISTS teams_parent_id_idx ON teams(parent_id);
CREATE INDEX IF NOT EXISTS teams_is_active_idx ON teams(is_active);

-- ============ Memberships Table ============
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, organization_id, team_id)
);

-- Create indexes for memberships
CREATE INDEX IF NOT EXISTS memberships_user_id_idx ON memberships(user_id);
CREATE INDEX IF NOT EXISTS memberships_organization_id_idx ON memberships(organization_id);
CREATE INDEX IF NOT EXISTS memberships_team_id_idx ON memberships(team_id);
CREATE INDEX IF NOT EXISTS memberships_role_idx ON memberships(role);
CREATE INDEX IF NOT EXISTS memberships_is_active_idx ON memberships(is_active);

-- ============ Resource Shares Table ============
CREATE TABLE IF NOT EXISTS resource_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    shared_with_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    permissions JSONB NOT NULL DEFAULT '{"read": true, "write": false, "admin": false}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(resource_type, resource_id, shared_with_user_id, shared_with_team_id, shared_with_organization_id)
);

-- Create indexes for resource_shares
CREATE INDEX IF NOT EXISTS resource_shares_resource_id_idx ON resource_shares(resource_id);
CREATE INDEX IF NOT EXISTS resource_shares_owner_id_idx ON resource_shares(owner_id);
CREATE INDEX IF NOT EXISTS resource_shares_shared_with_user_idx ON resource_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS resource_shares_shared_with_team_idx ON resource_shares(shared_with_team_id);
CREATE INDEX IF NOT EXISTS resource_shares_shared_with_org_idx ON resource_shares(shared_with_organization_id);
CREATE INDEX IF NOT EXISTS resource_shares_expires_at_idx ON resource_shares(expires_at);

-- Add organization_id to projects table for future use
ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Create index for projects.organization_id
CREATE INDEX IF NOT EXISTS projects_organization_id_idx ON projects(organization_id);

-- Add organization_id to tasks table for future use
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Create index for tasks.organization_id
CREATE INDEX IF NOT EXISTS tasks_organization_id_idx ON tasks(organization_id);

-- Add team_id to projects table for future use
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Create index for projects.team_id
CREATE INDEX IF NOT EXISTS projects_team_id_idx ON projects(team_id);

-- Add team_id to tasks table for future use
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Create index for tasks.team_id
CREATE INDEX IF NOT EXISTS tasks_team_id_idx ON tasks(team_id);

-- Insert trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_shares_updated_at BEFORE UPDATE ON resource_shares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
