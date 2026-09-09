package com.example.AviaryService.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.AviaryService.entity.Subscription;
import com.example.AviaryService.entity.User;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findByUser(User user);

    List<Subscription> findByActiveTrue();
}
