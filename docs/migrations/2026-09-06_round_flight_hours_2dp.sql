-- Round all stored hour readings to 2 decimal places.
--
-- Computed paths (FlightSuggestionService.accept, HoursService.recomputeChain,
-- HoursService.updateHours "add" branch) wrote raw double results, so the
-- flight logs and the users' hour totals accumulated float artifacts like
-- 2.0433333333333334. Those code paths now round via Formatting.roundHours;
-- this cleans the rows written before that change.
--
-- Real meters never exceed 2dp (Hobbs 0.1, Tach 0.01, AeroAPI minute
-- precision), so no real precision is lost. Safe to re-run (ROUND is
-- idempotent). NULLs are left as-is by ROUND.

UPDATE flight_logs SET
    block_time_out       = ROUND(block_time_out::numeric, 2),
    block_time_in        = ROUND(block_time_in::numeric, 2),
    time_in_service_out  = ROUND(time_in_service_out::numeric, 2),
    time_in_service_in   = ROUND(time_in_service_in::numeric, 2);

UPDATE users SET
    block_time_hours              = ROUND(block_time_hours::numeric, 2),
    time_in_service_hours         = ROUND(time_in_service_hours::numeric, 2),
    block_time_manual_baseline    = ROUND(block_time_manual_baseline::numeric, 2),
    time_in_service_manual_baseline = ROUND(time_in_service_manual_baseline::numeric, 2);
