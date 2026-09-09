package com.example.AviaryService.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.AviaryService.entity.AlertPreference;
import com.example.AviaryService.entity.User;

public interface AlertPreferenceRepository extends JpaRepository<AlertPreference, Long> {

    Optional<AlertPreference> findByUser(User user);

    List<AlertPreference> findByAlertsEnabledTrue();
}
