-- Drop triggers
drop trigger if exists update_error_logs_updated_at on error_logs;

-- Drop functions
drop function if exists update_updated_at_column();

-- Drop indexes
drop index if exists error_logs_timestamp_idx;
drop index if exists error_logs_severity_idx;
drop index if exists error_logs_status_idx;
drop index if exists error_logs_error_type_idx;
drop index if exists error_logs_context_idx;

-- Drop table
drop table if exists error_logs; 