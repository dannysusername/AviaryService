-- Rename Engine Time columns to Time in Service, matching the Java entity
-- field rename in User.java and FlightLog.java.
--
-- Per 14 CFR 1.1, what AeroAPI actually gives us (wheels-off to wheels-on)
-- is the FAA's "time in service" clock -- "Engine Time" was a mislabel, and
-- there's no real tachometer/engine data anywhere in this app.
--
-- Each column is handled with a DO block instead of a plain RENAME COLUMN,
-- because we got burned by this exact ordering issue on the last rename:
-- if the app has already booted once with the new entity field names before
-- this script runs, Hibernate's ddl-auto=update will have already created
-- the new columns (empty) alongside the old ones (which hold the real
-- data), and a plain RENAME COLUMN fails because the target name exists.
-- This script checks which case it's in and does the right thing either way.
--
-- Safe to run more than once.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'engine_time_hours')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'time_in_service_hours') THEN
        ALTER TABLE users RENAME COLUMN engine_time_hours TO time_in_service_hours;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'engine_time_hours') THEN
        UPDATE users SET time_in_service_hours = engine_time_hours WHERE engine_time_hours IS NOT NULL;
        ALTER TABLE users DROP COLUMN engine_time_hours;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'engine_time_updated_at')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'time_in_service_updated_at') THEN
        ALTER TABLE users RENAME COLUMN engine_time_updated_at TO time_in_service_updated_at;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'engine_time_updated_at') THEN
        UPDATE users SET time_in_service_updated_at = engine_time_updated_at WHERE engine_time_updated_at IS NOT NULL;
        ALTER TABLE users DROP COLUMN engine_time_updated_at;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'engine_time_updated_source')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'time_in_service_updated_source') THEN
        ALTER TABLE users RENAME COLUMN engine_time_updated_source TO time_in_service_updated_source;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'engine_time_updated_source') THEN
        UPDATE users SET time_in_service_updated_source = engine_time_updated_source WHERE engine_time_updated_source IS NOT NULL;
        ALTER TABLE users DROP COLUMN engine_time_updated_source;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'engine_time_manual_baseline')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'time_in_service_manual_baseline') THEN
        ALTER TABLE users RENAME COLUMN engine_time_manual_baseline TO time_in_service_manual_baseline;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'engine_time_manual_baseline') THEN
        UPDATE users SET time_in_service_manual_baseline = engine_time_manual_baseline WHERE engine_time_manual_baseline IS NOT NULL;
        ALTER TABLE users DROP COLUMN engine_time_manual_baseline;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_logs' AND column_name = 'engine_time_in')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_logs' AND column_name = 'time_in_service_in') THEN
        ALTER TABLE flight_logs RENAME COLUMN engine_time_in TO time_in_service_in;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_logs' AND column_name = 'engine_time_in') THEN
        UPDATE flight_logs SET time_in_service_in = engine_time_in WHERE engine_time_in IS NOT NULL;
        ALTER TABLE flight_logs DROP COLUMN engine_time_in;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_logs' AND column_name = 'engine_time_out')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_logs' AND column_name = 'time_in_service_out') THEN
        ALTER TABLE flight_logs RENAME COLUMN engine_time_out TO time_in_service_out;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_logs' AND column_name = 'engine_time_out') THEN
        UPDATE flight_logs SET time_in_service_out = engine_time_out WHERE engine_time_out IS NOT NULL;
        ALTER TABLE flight_logs DROP COLUMN engine_time_out;
    END IF;
END $$;
