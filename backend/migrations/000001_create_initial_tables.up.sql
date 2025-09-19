-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --- ENUM Types ---

-- Role-Based Access Control (RBAC) 
CREATE TYPE user_role AS ENUM (
  'user',
  'admin'
);

-- File/Folder Visibility Levels [cite: 36, 37]
CREATE TYPE visibility_level AS ENUM (
  'private',    -- Visible only to owner 
  'public',     -- Visible to anyone with the link 
  'specific'  -- Shared with specific users (Bonus) 
);

-- --- Table Definitions ---

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  storage_quota BIGINT NOT NULL DEFAULT 10485760, -- 10 MB default 
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE physical_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sha256_hash TEXT NOT NULL UNIQUE,          -- For content hashing and deduplication 
  size BIGINT NOT NULL,                        -- File size in bytes 
  mime_type TEXT NOT NULL,                     -- Validated MIME type [cite: 28]
  storage_path TEXT NOT NULL,                  -- Path to the file in storage (e.g., S3 key or local path)
  reference_count INT NOT NULL DEFAULT 0,      -- For managing deduplicated file deletion 
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES folders(id) ON DELETE SET NULL, -- Self-referencing for hierarchy 
  name TEXT NOT NULL,
  visibility visibility_level NOT NULL DEFAULT 'private',
  public_share_token TEXT UNIQUE,            -- For public link access 
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A user cannot have two folders with the same name in the same parent folder
  UNIQUE(owner_id, parent_folder_id, name)
);

CREATE TABLE logical_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Uploader/Owner [cite: 31, 42]
  physical_file_id UUID NOT NULL REFERENCES physical_files(id) ON DELETE RESTRICT, -- Link to the actual content 
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,      -- Link to folder
  filename TEXT NOT NULL,                      -- User-defined filename 
  visibility visibility_level NOT NULL DEFAULT 'private',
  public_share_token TEXT UNIQUE,
  download_count BIGINT NOT NULL DEFAULT 0,    -- For public file statistics 
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Upload date 
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A user cannot have two files with the same name in the same folder
  UNIQUE(owner_id, folder_id, filename)
);

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE file_tags (
  logical_file_id UUID NOT NULL REFERENCES logical_files(id) ON DELETE CASCADE,
  tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (logical_file_id, tag_id)
);

-- --- Bonus Tables ---

-- For sharing files/folders with specific users (Bonus) 
CREATE TABLE file_shares (
  logical_file_id UUID NOT NULL REFERENCES logical_files(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (logical_file_id, shared_with_user_id)
);

CREATE TABLE folder_shares (
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (folder_id, shared_with_user_id)
);

-- For audit logging (Bonus) [cite: 91]
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Keep log even if user is deleted
  action TEXT NOT NULL, -- e.g., 'FILE_UPLOAD', 'FILE_DELETE', 'FILE_DOWNLOAD'
  target_id UUID,     -- ID of the file/folder/user being acted upon
  details JSONB,        -- Extra details like IP, changes, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --- Indexes for Performance ---

-- Users
CREATE INDEX idx_users_email ON users(email);

-- Physical Files
CREATE INDEX idx_physical_files_hash ON physical_files(sha256_hash); -- Critical for deduplication lookup 

-- Folders
CREATE INDEX idx_folders_owner_id ON folders(owner_id);
CREATE INDEX idx_folders_parent_folder_id ON folders(parent_folder_id);

-- Logical Files
CREATE INDEX idx_logical_files_owner_id ON logical_files(owner_id);
CREATE INDEX idx_logical_files_physical_file_id ON logical_files(physical_file_id);
CREATE INDEX idx_logical_files_folder_id ON logical_files(folder_id);
-- GIN index for full-text search on filenames 
CREATE INDEX idx_logical_files_filename_search ON logical_files USING GIN (to_tsvector('english', filename));

-- Tags
CREATE INDEX idx_file_tags_tag_id ON file_tags(tag_id); -- Find files by tag

-- Shares (Bonus)
CREATE INDEX idx_file_shares_shared_with_user_id ON file_shares(shared_with_user_id);
CREATE INDEX idx_folder_shares_shared_with_user_id ON folder_shares(shared_with_user_id);

-- Audit Logs (Bonus)
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);


-- --- Triggers for Deduplication Logic ---

-- Function to increment reference count on new logical file creation
CREATE OR REPLACE FUNCTION increment_physical_file_ref_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE physical_files
  SET reference_count = reference_count + 1
  WHERE id = NEW.physical_file_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement reference count on logical file deletion
CREATE OR REPLACE FUNCTION decrement_physical_file_ref_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE physical_files
  SET reference_count = reference_count - 1
  WHERE id = OLD.physical_file_id;
  -- Deletion of physical_files with reference_count = 0 should be handled
  -- by a background job/worker to avoid blocking the user's delete request.
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment count AFTER INSERT on logical_files
CREATE TRIGGER trg_increment_ref_count
AFTER INSERT ON logical_files
FOR EACH ROW
EXECUTE FUNCTION increment_physical_file_ref_count();

-- Trigger to decrement count AFTER DELETE on logical_files 
CREATE TRIGGER trg_decrement_ref_count
AFTER DELETE ON logical_files
FOR EACH ROW
EXECUTE FUNCTION decrement_physical_file_ref_count();