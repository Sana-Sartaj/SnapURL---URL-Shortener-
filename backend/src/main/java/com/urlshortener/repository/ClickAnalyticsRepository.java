package com.urlshortener.repository;

import com.urlshortener.model.ClickAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ClickAnalyticsRepository extends JpaRepository<ClickAnalytics, Long> {

    List<ClickAnalytics> findByShortCodeOrderByClickedAtDesc(String shortCode);

    long countByShortCode(String shortCode);

    @Query("SELECT COUNT(c) FROM ClickAnalytics c WHERE c.clickedAt >= :since")
    long countClicksSince(@Param("since") LocalDateTime since);

    @Query("SELECT c.deviceType, COUNT(c) FROM ClickAnalytics c WHERE c.shortCode = :shortCode GROUP BY c.deviceType")
    List<Object[]> getDeviceBreakdown(@Param("shortCode") String shortCode);

    @Query("SELECT DATE(c.clickedAt), COUNT(c) FROM ClickAnalytics c WHERE c.shortCode = :shortCode " +
           "AND c.clickedAt >= :since GROUP BY DATE(c.clickedAt) ORDER BY DATE(c.clickedAt)")
    List<Object[]> getClicksByDay(@Param("shortCode") String shortCode, @Param("since") LocalDateTime since);
}
