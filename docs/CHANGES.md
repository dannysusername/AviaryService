# Planned Changes

Small, scoped things identified while building a feature but deliberately not
done at the time. Not a full roadmap — just a place to not lose these.

## DONE (2026-09-05): Garmin CSV parser now extracts real timestamps

`FlightLog` gained `blockTimeStart`/`blockTimeEnd` and
`timeInServiceStart`/`timeInServiceEnd` (`departureTime`/`arrivalTime`
renamed to the latter pair for symmetry — see `docs/migrations/`). The
Garmin CSV parser now combines `Lcl Date` + `Lcl Time` + `UTCOfst` into real
UTC instants instead of discarding the date/offset after computing a
duration. Manual entries can optionally set the same four fields via new
datetime-local inputs. The flight log table now sorts chronologically by
these timestamps instead of by entry order, and `HoursService.recomputeChain`
keeps every CSV/AeroAPI row's Out/In accurate relative to real flight time
regardless of what order rows were added in — see `FlightLog.source` and
`HoursService.recomputeChain`/`checkAccuracy`.

## Possible future feature: cross-check AeroAPI suggestions against all FlightLog rows

**What:** right now, AeroAPI dedupe only compares new flights against other
AeroAPI-sourced flights (`fa_flight_id`). It does not check whether a
suggested flight overlaps something the user already entered manually or via
CSV — so AeroAPI can suggest a flight the user already logged another way,
and the user has to Dismiss it themselves.

**Why it's deferred:** matching a suggested flight against arbitrary manual/
CSV log entries (no shared ID, only approximate timestamps) is a real
matching problem, not a quick add. Decided 2026-09-04 to keep v1 simple:
AeroAPI-vs-AeroAPI dedupe only, rely on Dismiss for everything else. As of
2026-09-05 manual/CSV entries do now carry real timestamps
(`FlightLog.blockTimeStart`/`timeInServiceStart` etc. — see the item above),
so the "only approximate timestamps" blocker for CSV rows is gone; the
matching-logic complexity itself is still unbuilt.

**If ever built:** compare a new AeroAPI flight's `actual_off`/`actual_on`
window against existing `FlightLog.timeInServiceStart`/`timeInServiceEnd` for
that user, skip creating a suggestion on overlap.

## Other AeroAPI endpoints worth considering later

Checked the full spec (`aeroapi-openapi.yml`, 64 endpoints — verified
2026-09-04, only 12 were visible in an earlier pass because path keys are
YAML-quoted; correcting that turned up the rest). Not built, just noting
what's there:

- **`GET /account/usage`** — returns `total_cost`, `total_calls`,
  `total_failed_calls`, per-resource breakdown, for a date range. Directly
  useful for the still-open "will I get auto-charged past $5/month" question
  — could show the user their actual current-month spend in Settings instead
  of leaving them to guess. Updated every 10 minutes per FlightAware, not
  real-time.
- **`POST /alerts`** — AeroAPI can push a webhook to a URL we host on
  departure/arrival events, instead of us polling on a schedule. Worth real
  consideration as a replacement for the poller entirely — needs a publicly
  reachable endpoint (not available on localhost dev), which is why polling
  was the simpler starting point.
- **`GET /aircraft/{ident}/owner`** and **`GET /aircraft/{ident}/blocked`** —
  exactly what the deferred FAA-ownership check (see `ADSB_SYNC_SPEC.md`,
  "What's not built") and the LADD/PIA privacy-program dead end would use,
  whenever that gets built.
- **`GET /history/aircraft/{registration}/last_flight`** — cheap "has
  anything happened since I last checked" poll, lighter than a full
  `/flights/{ident}` call. Could replace the current call if per-call cost
  ever matters.
