package com.example.AviaryService.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.AviaryService.entity.AlertRecipient;
import com.example.AviaryService.entity.User;

public interface AlertRecipientRepository extends JpaRepository<AlertRecipient, Long> {

    List<AlertRecipient> findByUserOrderByCreatedAtAsc(User user);

    List<AlertRecipient> findByUserAndStatus(User user, String status);

    Optional<AlertRecipient> findByConfirmToken(String confirmToken);

    Optional<AlertRecipient> findByUserAndChannelAndDestination(User user, String channel, String destination);

    // PENDING rows awaiting their reminder / expiry, evaluated by the daily sweep.
    List<AlertRecipient> findByStatus(String status);
}
