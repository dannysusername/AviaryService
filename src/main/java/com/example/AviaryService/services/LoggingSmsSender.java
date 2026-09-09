package com.example.AviaryService.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

// Placeholder SMS sender: logs what it would send and returns. Keeps the whole
// SMS code path (recipients, consent, digests, rate limiting) live and testable
// while real Twilio delivery waits on A2P 10DLC registration. Swap for a
// TwilioSmsSender bean when that clears -- callers depend on SmsSender, not this.
@Service
public class LoggingSmsSender implements SmsSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingSmsSender.class);

    @Override
    public boolean isConfigured() {
        return false;
    }

    @Override
    public void send(String toPhoneE164, String body) {
        log.info("[SMS stub] would send to {}: {}", toPhoneE164, body);
    }
}
