# Planned Changes

Small, scoped things identified while building a feature but deliberately not
done at the time. Not a full roadmap — just a place to not lose these.

## Maintenance due-date alerts (email/SMS to owner or shop)

**BUILT 2026-09-08** — full backend, email path, and a functional Settings UI.
See `docs/ALERTS_SPEC.md`. Email is live once `SENDGRID_API_KEY` /
`AVIARY_SENDGRID_FROM` are set; SMS ships as the recipient/consent model +
`LoggingSmsSender` only (real Twilio + A2P 10DLC still to do). New: entities
`AlertPreference` / `AlertRecipient` / `AlertSendLog`, `service_timelines`
gains `alert_level` + `alert_last_fired_at`, `AlertService` /
`AlertDigestService` / `NotificationService` / `AlertScheduler`,
`/alerts/*` endpoints, migration `docs/migrations/2026-09-08_maintenance_alerts.sql`.
The notes below are the original pre-build plan, kept for context.

**What:** alert the aircraft owner or maintenance shop when a Service
Timeline item is nearing its due date/hours, instead of relying on someone
opening the dashboard to notice.

**Checked 2026-09-06: Twilio is NOT actually set up in this project.** No
Twilio dependency in `build.gradle`, no credentials in `.env`, no SMS code
anywhere. "Forgot password?" on the login page is a dead link with no
backing endpoint. `docs/SHARE_EXPORT_SPEC.md` lists Twilio as a *planned*
Phase 3 for the (also unbuilt) PDF-share-via-text feature — that's likely
what got remembered as "already set up." There is also currently no email or
phone number stored anywhere on `User`.

**What already exists to build on:**
- A `@Scheduled` background job already runs (`FlightSyncService`,
  `@EnableScheduling` already on at the app level) — the same pattern fits a
  daily alert-check job, no new scheduling infra needed.
- "Is this due soon" math already exists, split across two places:
  `UserController.computeTimeLeftString` (hours, server-side) and
  `calculateTimeLeft` in `dashboard.js` (calendar dates, client-side only).

**What's missing before this can work:**
1. A contact channel — at minimum an email field on `User` (decide: alert
   the pilot, a separate shop contact, or both). Phone number too if SMS is
   wanted later.
2. A way to actually send something — email (SendGrid, or free Gmail SMTP
   to start) is simpler than SMS (Twilio needs a paid account + phone number
   + A2P 10DLC carrier registration, a multi-day approval process).
3. A "don't repeat yourself" flag per `ServiceTimeline` row (e.g. "last
   alerted at") so a daily check doesn't re-alert every single day once an
   item crosses the threshold.
4. A due-soon threshold (e.g. 30 days / 10 hours out) — fixed default is
   fine to start.

**Suggested order:** email first (free, no approval wait, proves the whole
pipeline) → move the calendar due-date math server-side so a background job
can check every row, not just what's open in a browser → add the
already-alerted flag → Twilio/SMS as a later phase, reusing whatever account
setup the Share feature's texting phase eventually needs too.

## Airport code autocomplete for From/To fields

**What:** a typeahead dropdown under the From/To flight-log inputs that
filters a list of airports (code, name, city) as the user types, so they can
type either the code or the city and pick from matches — same pattern
already used elsewhere in this app (the Service Timeline description
dropdown), fed by airport data instead.

**Data:** the `deadhead` project has `data/airports.csv` — but it's a
worldwide dataset, and this app only needs US airports. Decided
2026-09-06 not to pull the whole world in for now.

**Next step when picked back up:** either trim that CSV down to US-only
before copying it in, or just grab US airports fresh from a free source
(OurAirports.com) sized for this app specifically.

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
