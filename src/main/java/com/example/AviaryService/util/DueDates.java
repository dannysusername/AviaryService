package com.example.AviaryService.util;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import com.example.AviaryService.services.AlertLevel;

// Turns a Service Timeline row's stored due-date / due-hours strings into a
// number of days / hours remaining, and classifies that against a user's alert
// thresholds. Mirrors computeTimeLeftString in UserController (server-side date
// math) and calculateTimeLeft in dashboard.js (client-side). See
// docs/ALERTS_SPEC.md.
public final class DueDates {

    private DueDates() {
    }

    // Whole days from today until dueDateDate (negative = overdue). null when the
    // string is blank or unparseable. dueDateDate is stored ISO ("2026-09-10");
    // legacy rows may append hours ("2026-09-10 12.5") so only the first token
    // is parsed.
    public static Long daysUntil(String dueDateDate, LocalDate today) {
        LocalDate due = parseDate(dueDateDate);
        if (due == null) {
            return null;
        }
        return ChronoUnit.DAYS.between(today, due);
    }

    // Hours of time-in-service remaining until the item is due (negative =
    // overdue). null when either value is missing/unparseable.
    public static Double hoursUntil(String dueDateHours, Double currentTimeInService) {
        Double due = Parsing.parseDoubleOrNull(trimFirstToken(dueDateHours));
        if (due == null || currentTimeInService == null) {
            return null;
        }
        return due - currentTimeInService;
    }

    // The item's alert level: the worse of its date-based and hours-based
    // standing. An item with neither a due date nor due hours is OK.
    public static AlertLevel classify(String dueDateDate, String dueDateHours,
                                      Double currentTimeInService, LocalDate today,
                                      int leadTimeDays, int leadTimeHours) {
        AlertLevel level = AlertLevel.OK;

        Long days = daysUntil(dueDateDate, today);
        if (days != null) {
            if (days < 0) {
                level = AlertLevel.OVERDUE;
            } else if (days <= leadTimeDays) {
                level = AlertLevel.DUE_SOON;
            }
        }

        Double hours = hoursUntil(dueDateHours, currentTimeInService);
        if (hours != null) {
            AlertLevel hoursLevel = hours < 0 ? AlertLevel.OVERDUE
                : (hours <= leadTimeHours ? AlertLevel.DUE_SOON : AlertLevel.OK);
            if (hoursLevel.worseThan(level)) {
                level = hoursLevel;
            }
        }

        return level;
    }

    private static LocalDate parseDate(String raw) {
        String token = trimFirstToken(raw);
        if (token == null) {
            return null;
        }
        try {
            return LocalDate.parse(token);
        } catch (Exception e) {
            return null;
        }
    }

    private static String trimFirstToken(String raw) {
        if (raw == null) {
            return null;
        }
        String s = raw.trim();
        if (s.isEmpty()) {
            return null;
        }
        int sp = s.indexOf(' ');
        return sp < 0 ? s : s.substring(0, sp);
    }
}
