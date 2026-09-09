package com.example.AviaryService.services;

// Outbound SMS, provider-agnostic. Real delivery (Twilio) is blocked on A2P
// 10DLC carrier registration, which takes weeks -- until then LoggingSmsSender
// stands in and every SMS path is exercised without actually sending.
// TwilioSmsSender will be a drop-in replacement. See docs/ALERTS_SPEC.md.
public interface SmsSender {

    boolean isConfigured();

    void send(String toPhoneE164, String body);
}
