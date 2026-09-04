package com.example.AviaryService.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.AviaryService.entity.FlightSuggestion;
import com.example.AviaryService.entity.User;

public interface FlightSuggestionRepository extends JpaRepository<FlightSuggestion, Long> {

    Optional<FlightSuggestion> findByUserAndFaFlightId(User user, String faFlightId);

    List<FlightSuggestion> findByUserAndStatus(User user, String status);

    List<FlightSuggestion> findByUserOrderByCreatedAtDesc(User user);
}
