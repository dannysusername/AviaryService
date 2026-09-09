package com.example.AviaryService.repositories;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import com.example.AviaryService.entity.AlertSendLog;

public interface AlertSendLogRepository extends JpaRepository<AlertSendLog, Long> {

    // Rate-limit check: has this recipient been sent to since `since`?
    boolean existsByRecipientIdAndSentAtAfter(long recipientId, Instant since);

    @Transactional
    void deleteBySentAtBefore(Instant cutoff);
}
