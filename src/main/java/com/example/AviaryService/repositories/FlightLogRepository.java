package com.example.AviaryService.repositories;

import com.example.AviaryService.entity.FlightLog;
import com.example.AviaryService.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FlightLogRepository extends JpaRepository<FlightLog, Long> {
    List<FlightLog> findByUser(User user);

    Optional<FlightLog> findByUserAndFaFlightId(User user, String faFlightId);
}