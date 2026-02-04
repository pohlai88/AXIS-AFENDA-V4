-- MagicFolder Saved Views
-- Stores user and tenant-level saved views/filters

CREATE TABLE IF NOT EXISTS magicfolder_saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- View details
  name TEXT NOT NULL,
  description TEXT,
  
  -- View configuration (JSON)
  filters JSONB NOT NULL DEFAULT '{}',
  view_mode TEXT NOT NULL DEFAULT 'cards',
  sort_by TEXT NOT NULL DEFAULT 'createdAt',
  sort_order TEXT NOT NULL DEFAULT 'desc',
  
  -- Visibility
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT magicfolder_saved_views_name_unique_per_user 
    UNIQUE (tenant_id, user_id, name),
  CONSTRAINT magicfolder_saved_views_valid_view_mode 
    CHECK (view_mode IN ('cards', 'table', 'board', 'timeline', 'relationship')),
  CONSTRAINT magicfolder_saved_views_valid_sort_by 
    CHECK (sort_by IN ('createdAt', 'title', 'sizeBytes', 'updatedAt', 'relevance')),
  CONSTRAINT magicfolder_saved_views_valid_sort_order 
    CHECK (sort_order IN ('asc', 'desc'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_magicfolder_saved_views_tenant_user 
  ON magicfolder_saved_views(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_magicfolder_saved_views_tenant_public 
  ON magicfolder_saved_views(tenant_id) 
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_magicfolder_saved_views_created_at 
  ON magicfolder_saved_views(created_at DESC);

-- MagicFolder User Preferences
-- Stores user-specific preferences for MagicFolder

CREATE TABLE IF NOT EXISTS magicfolder_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- General preferences
  default_view TEXT NOT NULL DEFAULT 'cards',
  items_per_page INTEGER NOT NULL DEFAULT 20,
  default_sort TEXT NOT NULL DEFAULT 'createdAt-desc',
  show_file_extensions BOOLEAN NOT NULL DEFAULT true,
  show_thumbnails BOOLEAN NOT NULL DEFAULT true,
  compact_mode BOOLEAN NOT NULL DEFAULT false,
  
  -- Quick settings (JSON)
  quick_settings JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT magicfolder_user_preferences_unique 
    UNIQUE (tenant_id, user_id),
  CONSTRAINT magicfolder_user_preferences_valid_view 
    CHECK (default_view IN ('cards', 'table', 'board', 'timeline', 'relationship')),
  CONSTRAINT magicfolder_user_preferences_valid_items_per_page 
    CHECK (items_per_page IN (10, 20, 50, 100))
);

-- Index for user preferences lookup
CREATE INDEX IF NOT EXISTS idx_magicfolder_user_preferences_tenant_user 
  ON magicfolder_user_preferences(tenant_id, user_id);

-- MagicFolder Tenant Settings
-- Stores tenant-wide MagicFolder configurations

CREATE TABLE IF NOT EXISTS magicfolder_tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  tenant_id UUID NOT NULL UNIQUE,
  
  -- Document types configuration
  document_types JSONB NOT NULL DEFAULT '[
    {"value": "invoice", "label": "Invoices", "enabled": true},
    {"value": "contract", "label": "Contracts", "enabled": true},
    {"value": "receipt", "label": "Receipts", "enabled": true},
    {"value": "other", "label": "Other", "enabled": true}
  ]',
  
  -- Status workflow configuration
  status_workflow JSONB NOT NULL DEFAULT '[
    {"value": "inbox", "label": "Inbox", "color": "#3b82f6", "enabled": true},
    {"value": "active", "label": "Active", "color": "#22c55e", "enabled": true},
    {"value": "archived", "label": "Archived", "color": "#6b7280", "enabled": true},
    {"value": "deleted", "label": "Deleted", "color": "#ef4444", "enabled": true}
  ]',
  
  -- Feature flags
  enable_ai_suggestions BOOLEAN NOT NULL DEFAULT true,
  enable_public_shares BOOLEAN NOT NULL DEFAULT true,
  max_file_size_mb INTEGER NOT NULL DEFAULT 100,
  allowed_file_types TEXT[] NOT NULL DEFAULT ARRAY[
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 
    'ppt', 'pptx', 'txt', 'rtf', 'odt', 
    'ods', 'odp', 'jpg', 'jpeg', 'png', 
    'gif', 'bmp', 'tiff', 'webp'
  ],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for magicfolder_saved_views
ALTER TABLE magicfolder_saved_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own views and public views in their tenant
CREATE POLICY "Users can view own and public views" 
ON magicfolder_saved_views FOR SELECT 
USING (
  tenant_id = current_setting('app.current_tenant_id', true)::uuid 
  AND (
    user_id = current_setting('app.current_user_id', true)::uuid 
    OR is_public = true
  )
);

-- Users can create their own views
CREATE POLICY "Users can create views" 
ON magicfolder_saved_views FOR INSERT 
WITH CHECK (
  tenant_id = current_setting('app.current_tenant_id', true)::uuid 
  AND user_id = current_setting('app.current_user_id', true)::uuid
);

-- Users can update their own views
CREATE POLICY "Users can update own views" 
ON magicfolder_saved_views FOR UPDATE 
USING (
  tenant_id = current_setting('app.current_tenant_id', true)::uuid 
  AND user_id = current_setting('app.current_user_id', true)::uuid
);

-- Users can delete their own views
CREATE POLICY "Users can delete own views" 
ON magicfolder_saved_views FOR DELETE 
USING (
  tenant_id = current_setting('app.current_tenant_id', true)::uuid 
  AND user_id = current_setting('app.current_user_id', true)::uuid
);

-- RLS Policies for magicfolder_user_preferences
ALTER TABLE magicfolder_user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences" 
ON magicfolder_user_preferences FOR SELECT 
USING (
  tenant_id = current_setting('app.current_tenant_id', true)::uuid 
  AND user_id = current_setting('app.current_user_id', true)::uuid
);

-- Users can create their own preferences
CREATE POLICY "Users can create preferences" 
ON magicfolder_user_preferences FOR INSERT 
WITH CHECK (
  tenant_id = current_setting('app.current_tenant_id', true)::uuid 
  AND user_id = current_setting('app.current_user_id', true)::uuid
);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" 
ON magicfolder_user_preferences FOR UPDATE 
USING (
  tenant_id = current_setting('app.current_tenant_id', true)::uuid 
  AND user_id = current_setting('app.current_user_id', true)::uuid
);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences" 
ON magicfolder_user_preferences FOR DELETE 
USING (
  tenant_id = current_setting('app.current_tenant_id', true)::uuid 
  AND user_id = current_setting('app.current_user_id', true)::uuid
);

-- RLS Policies for magicfolder_tenant_settings
ALTER TABLE magicfolder_tenant_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their tenant's settings
CREATE POLICY "Users can view tenant settings" 
ON magicfolder_tenant_settings FOR SELECT 
USING (
  tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

-- Admins can update tenant settings
CREATE POLICY "Admins can update tenant settings" 
ON magicfolder_tenant_settings FOR UPDATE 
USING (
  tenant_id = current_setting('app.current_tenant_id', true)::uuid
  AND current_setting('app.current_user_role', true) = 'admin'
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_magicfolder_saved_views_timestamp
  BEFORE UPDATE ON magicfolder_saved_views
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_magicfolder_user_preferences_timestamp
  BEFORE UPDATE ON magicfolder_user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_magicfolder_tenant_settings_timestamp
  BEFORE UPDATE ON magicfolder_tenant_settings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();
