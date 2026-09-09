-- Rename FlightLog's departure_time/arrival_time columns to
-- time_in_service_start/time_in_service_end, matching the entity field
-- rename in FlightLog.java. Done for symmetry with the new
-- block_time_start/block_time_end columns (Hibernate adds those on its own
-- via ddl-auto=update -- no migration needed for a brand new column).
--
-- Same DO-block pattern as the earlier renames: handles both "app hasn't
-- booted with the new field names yet" (plain rename) and "it already has,
-- so ddl-auto=update already created the new column empty" (copy + drop).
-- Safe to run more than once.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_logs' AND column_name = 'departure_time')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_logs' AND column_name = 'time_in_service_start') THEN
        ALTER TABLE flight_logs RENAME COLUMN departure_time TO time_in_service_start;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_logs' AND column_name = 'departure_time') THEN
        UPDATE flight_logs SET time_in_service_start = departure_time WHERE departure_time IS NOT NULL;
        ALTER TABLE flight_logs DROP COLUMN departure_time;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_logs' AND column_name = 'arrival_time')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_logs' AND column_name = 'time_in_service_end') THEN
        ALTER TABLE flight_logs RENAME COLUMN arrival_time TO time_in_service_end;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_logs' AND column_name = 'arrival_time') THEN
        UPDATE flight_logs SET time_in_service_end = arrival_time WHERE arrival_time IS NOT NULL;
        ALTER TABLE flight_logs DROP COLUMN arrival_time;
    END IF;
END $$;

-- Existing rows have no `source` column value yet -- backfill it so
-- recomputeChain treats already-accepted AeroAPI flights correctly instead
-- of relying on the fa_flight_id fallback (getEffectiveSource() would infer
-- the same thing, but setting it explicitly is cheap and one less thing to
-- reason about later). Guarded because `source` is a brand new column that
-- only exists once the app has booted at least once with the new entity --
-- run this migration again after that first boot if it doesn't exist yet.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_logs' AND column_name = 'source') THEN
        UPDATE flight_logs SET source = 'aeroapi' WHERE source IS NULL AND fa_flight_id IS NOT NULL;
        UPDATE flight_logs SET source = 'manual' WHERE source IS NULL;
    END IF;
END $$;
