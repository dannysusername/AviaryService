package com.example.AviaryService.services;

// The result of evaluating a user's Service Timeline for alerts: whether
// anything is worth sending, and the rendered subject / body if so.
// Immutable value object -- persistence of per-item state is done separately
// by AlertDigestService.markFired(). See docs/ALERTS_SPEC.md.
public class AlertDigest {

    private final boolean shouldSend;
    private final String subject;
    private final String body;
    private final int overdueCount;
    private final int dueSoonCount;

    public AlertDigest(boolean shouldSend, String subject, String body, int overdueCount, int dueSoonCount) {
        this.shouldSend = shouldSend;
        this.subject = subject;
        this.body = body;
        this.overdueCount = overdueCount;
        this.dueSoonCount = dueSoonCount;
    }

    public boolean shouldSend() {
        return shouldSend;
    }

    public String subject() {
        return subject;
    }

    public String body() {
        return body;
    }

    public int overdueCount() {
        return overdueCount;
    }

    public int dueSoonCount() {
        return dueSoonCount;
    }
}
