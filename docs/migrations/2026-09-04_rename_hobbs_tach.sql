-- Rename Hobbs/Tach columns to Block Time/Engine Time, matching the Java
-- entity field rename in User.java and FlightLog.java.
--
-- SUPERSEDES the first version of this file. The app already booted once
-- with the renamed entity before this ran, so Hibernate's ddl-auto=update
-- already created the 12 new columns (empty) alongside the 12 old ones
-- (which still hold the real data) -- confirmed 2026-09-04 by inspecting the
-- live DB. A plain RENAME COLUMN fails because the target name now exists.
-- This version copies the data across, then drops the old column.
--
-- Safe to run more than once: UPDATE is idempotent, and DROP COLUMN IF EXISTS
-- no-ops on a second run.

UPDATE users SET block_time_hours = hobbs_hours WHERE hobbs_hours IS NOT NULL;
UPDATE users SET engine_time_hours = tach_hours WHERE tach_hours IS NOT NULL;
UPDATE users SET block_time_updated_at = hobbs_updated_at WHERE hobbs_updated_at IS NOT NULL;
UPDATE users SET engine_time_updated_at = tach_updated_at WHERE tach_updated_at IS NOT NULL;
UPDATE users SET block_time_updated_source = hobbs_updated_source WHERE hobbs_updated_source IS NOT NULL;
UPDATE users SET engine_time_updated_source = tach_updated_source WHERE tach_updated_source IS NOT NULL;
UPDATE users SET block_time_manual_baseline = hobbs_manual_baseline WHERE hobbs_manual_baseline IS NOT NULL;
UPDATE users SET engine_time_manual_baseline = tach_manual_baseline WHERE tach_manual_baseline IS NOT NULL;

UPDATE flight_logs SET block_time_in = hobbs_in WHERE hobbs_in IS NOT NULL;
UPDATE flight_logs SET block_time_out = hobbs_out WHERE hobbs_out IS NOT NULL;
UPDATE flight_logs SET engine_time_in = tach_in WHERE tach_in IS NOT NULL;
UPDATE flight_logs SET engine_time_out = tach_out WHERE tach_out IS NOT NULL;

ALTER TABLE users DROP COLUMN IF EXISTS hobbs_hours;
ALTER TABLE users DROP COLUMN IF EXISTS tach_hours;
ALTER TABLE users DROP COLUMN IF EXISTS hobbs_updated_at;
ALTER TABLE users DROP COLUMN IF EXISTS tach_updated_at;
ALTER TABLE users DROP COLUMN IF EXISTS hobbs_updated_source;
ALTER TABLE users DROP COLUMN IF EXISTS tach_updated_source;
ALTER TABLE users DROP COLUMN IF EXISTS hobbs_manual_baseline;
ALTER TABLE users DROP COLUMN IF EXISTS tach_manual_baseline;

ALTER TABLE flight_logs DROP COLUMN IF EXISTS hobbs_in;
ALTER TABLE flight_logs DROP COLUMN IF EXISTS hobbs_out;
ALTER TABLE flight_logs DROP COLUMN IF EXISTS tach_in;
ALTER TABLE flight_logs DROP COLUMN IF EXISTS tach_out;
