-- Drop Triggers
DROP TRIGGER IF EXISTS trg_increment_ref_count ON logical_files;
DROP TRIGGER IF EXISTS trg_decrement_ref_count ON logical_files;

-- Drop Functions
DROP FUNCTION IF EXISTS increment_physical_file_ref_count;
DROP FUNCTION IF EXISTS decrement_physical_file_ref_count;

-- Drop Bonus Tables
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS folder_shares;
DROP TABLE IF EXISTS file_shares;

-- Drop Junction/Join Table
DROP TABLE IF EXISTS file_tags;

-- Drop Main Tables in reverse dependency order
DROP TABLE IF EXISTS logical_files;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS folders;
DROP TABLE IF EXISTS physical_files;
DROP TABLE IF EXISTS users;

-- Drop ENUM Types
DROP TYPE IF EXISTS visibility_level;
DROP TYPE IF EXISTS user_role;

-- Drop Extensions (if you need to completely remove it)
-- Note: Dropping extensions can affect other parts of your DB,
-- so it's often best to leave them unless you are doing a full teardown.
-- DROP EXTENSION IF EXISTS "uuid-ossp";