CREATE TABLE IF NOT EXISTS subdomain_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain VARCHAR(63) UNIQUE NOT NULL,
  organization_id UUID NOT NULL,
  team_id UUID,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_primary BOOLEAN DEFAULT false NOT NULL,
  created_by UUID NOT NULL,
  customization JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_subdomain_config_org_id ON subdomain_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_subdomain_config_subdomain ON subdomain_config(subdomain);
CREATE INDEX IF NOT EXISTS idx_subdomain_config_is_active ON subdomain_config(is_active);
CREATE INDEX IF NOT EXISTS idx_subdomain_config_is_primary ON subdomain_config(is_primary, organization_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_subdomain_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subdomain_config_updated_at_trigger
BEFORE UPDATE ON subdomain_config
FOR EACH ROW
EXECUTE FUNCTION update_subdomain_config_updated_at();
