-- Drop the consolidated tables that aren't currently needed
DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS user_collections CASCADE;

-- Drop any related indexes and triggers
DROP TRIGGER IF EXISTS update_user_activities_timestamp ON user_activities;
DROP TRIGGER IF EXISTS update_user_collections_timestamp ON user_collections; 