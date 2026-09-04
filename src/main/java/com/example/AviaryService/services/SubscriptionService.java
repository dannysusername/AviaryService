package com.example.AviaryService.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.AviaryService.entity.Subscription;
import com.example.AviaryService.entity.User;
import com.example.AviaryService.repositories.SubscriptionRepository;



@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @Transactional
    public boolean toggle(User user, String tailNumber) {
        Subscription sub = subscriptionRepository.findByUserAndTailNumber(user, tailNumber);
        //in the future only allow one tailNumber subscription per user
        boolean turningOn = (sub == null) || !sub.isActive();

        if (turningOn && (user.getAeroApiKey() == null || user.getAeroApiKey().isEmpty())) {
            throw new IllegalArgumentException("Connect an AeroAPI key in Settings before turning on flight sync.");
        }

        if(sub == null) {
            sub = new Subscription(user, tailNumber);
        } else {
            sub.setActive(!sub.isActive());
        }

        subscriptionRepository.save(sub);
        return sub.isActive();

    }

    // See docs/ADSB_SYNC_SPEC.md "Poll interval" for the 1-9 day / 0-23 hour bounds.
    @Transactional
    public void updateSettings(User user, String tailNumber, int pollIntervalDays, int preferredCheckHour) {
        if (pollIntervalDays < 1 || pollIntervalDays > 9) {
            throw new IllegalArgumentException("Check interval must be between 1 and 9 days.");
        }
        if (preferredCheckHour < 0 || preferredCheckHour > 23) {
            throw new IllegalArgumentException("Preferred hour must be between 0 and 23.");
        }
        Subscription sub = subscriptionRepository.findByUserAndTailNumber(user, tailNumber);
        if (sub == null) {
            throw new IllegalArgumentException("Turn on flight sync for this tail number first.");
        }
        sub.setPollIntervalDays(pollIntervalDays);
        sub.setPreferredCheckHour(preferredCheckHour);
        subscriptionRepository.save(sub);
    }

}
