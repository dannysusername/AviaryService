package com.example.AviaryService.services;

// Where a Service Timeline item sits relative to its due date, for alerting.
// Ordinal order is the severity order: OK < DUE_SOON < OVERDUE. The daily sweep
// fires when an item's current level outranks the level it last alerted at.
public enum AlertLevel {
    OK,
    DUE_SOON,
    OVERDUE;

    public boolean worseThan(AlertLevel other) {
        return this.ordinal() > other.ordinal();
    }

    public static AlertLevel parse(String stored) {
        if (stored == null || stored.isBlank()) {
            return OK;
        }
        try {
            return AlertLevel.valueOf(stored);
        } catch (IllegalArgumentException e) {
            return OK;
        }
    }

    // Stored on ServiceTimeline.alertLevel: null for OK (keeps existing rows
    // untouched), the enum name otherwise.
    public String stored() {
        return this == OK ? null : name();
    }
}
