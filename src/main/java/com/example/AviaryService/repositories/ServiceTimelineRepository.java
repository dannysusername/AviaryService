package com.example.AviaryService.repositories;

import com.example.AviaryService.entity.ServiceTimeline;
import com.example.AviaryService.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceTimelineRepository extends JpaRepository<ServiceTimeline, Long> {
    List<ServiceTimeline> findByUserOrderByIdAsc(User user);
}