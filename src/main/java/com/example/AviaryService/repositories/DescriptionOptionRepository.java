package com.example.AviaryService.repositories;

import com.example.AviaryService.entity.DescriptionOption;
import com.example.AviaryService.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DescriptionOptionRepository extends JpaRepository<DescriptionOption, Long> {
    List<DescriptionOption> findByUser(User user);
}