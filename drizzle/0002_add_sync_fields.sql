-- Add sync fields to support offline mode and synchronization
-- Migration: 0002_add_sync_fields

-- Add sync fields to tasks table
ALTER TABLE tasks 
ADD COLUMN client_generated_id VARCHAR(255) UNIQUE,
ADD COLUMN sync_status VARCHAR(20) NOT NULL DEFAULT 'synced',
ADD COLUMN sync_version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE;

-- Add sync fields to projects table  
ALTER TABLE projects
ADD COLUMN client_generated_id VARCHAR(255) UNIQUE,
ADD COLUMN sync_status VARCHAR(20) NOT NULL DEFAULT 'synced',
ADD COLUMN sync_version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for tasks sync fields
CREATE INDEX IF NOT EXISTS tasks_client_generated_id_idx ON tasks(client_generated_id);
CREATE INDEX IF NOT EXISTS tasks_sync_status_idx ON tasks(sync_status);
CREATE INDEX IF NOT EXISTS tasks_last_synced_at_idx ON tasks(last_synced_at);

-- Create indexes for projects sync fields
CREATE INDEX IF NOT EXISTS projects_client_generated_id_idx ON projects(client_generated_id);
CREATE INDEX IF NOT EXISTS projects_sync_status_idx ON projects(sync_status);
CREATE INDEX IF NOT EXISTS projects_last_synced_at_idx ON projects(last_synced_at);

-- Create sync_queue table for tracking pending operations
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'task' or 'project'
    entity_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
    data JSONB, -- The entity data for the operation
    client_generated_id VARCHAR(255), -- For offline-created entities
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for sync_queue
CREATE INDEX IF NOT EXISTS sync_queue_user_id_idx ON sync_queue(user_id);
CREATE INDEX IF NOT EXISTS sync_queue_entity_idx ON sync_queue(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS sync_queue_status_idx ON sync_queue(processed_at);

-- Create sync_conflicts table for tracking conflicts
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    client_data JSONB NOT NULL,
    server_data JSONB NOT NULL,
    conflict_type VARCHAR(50) NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolution_strategy VARCHAR(50),
    resolved_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for sync_conflicts
CREATE INDEX IF NOT EXISTS sync_conflicts_user_id_idx ON sync_conflicts(user_id);
CREATE INDEX IF NOT EXISTS sync_conflicts_entity_idx ON sync_conflicts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS sync_conflicts_resolved_idx ON sync_conflicts(resolved);
