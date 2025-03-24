package com.example.AviaryService.repositories;

import com.example.AviaryService.entity.ServiceTimeline;
import com.example.AviaryService.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ServiceTimelineRepository extends JpaRepository<ServiceTimeline, Long> {
    List<ServiceTimeline> findByUserOrderByIdAsc(User user);
    List<ServiceTimeline> findByUserOrderByTimelineOrderAsc(User user);

    @Query("SELECT MAX(t.timelineOrder) FROM ServiceTimeline t WHERE t.user = :user")
    Integer findMaxTimelineOrderByUser(@Param("user") User user);
    
}