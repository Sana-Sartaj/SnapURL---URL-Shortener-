package com.urlshortener.repository;

import com.urlshortener.model.Url;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UrlRepository extends JpaRepository<Url, Long> {

    Optional<Url> findByShortCode(String shortCode);

    boolean existsByShortCode(String shortCode);

    Optional<Url> findByShortCodeAndIsActiveTrue(String shortCode);

    /**
     * Atomic click count increment — avoids read-modify-write race conditions.
     * Used in the async analytics path.
     */
    @Modifying
    @Query("UPDATE Url u SET u.clickCount = u.clickCount + 1, u.lastAccessedAt = :now WHERE u.shortCode = :shortCode")
    int incrementClickCount(@Param("shortCode") String shortCode, @Param("now") LocalDateTime now);

    /**
     * Cleanup expired URLs (run by scheduler)
     */
    @Modifying
    @Query("UPDATE Url u SET u.isActive = false WHERE u.expiresAt IS NOT NULL AND u.expiresAt < :now AND u.isActive = true")
    int deactivateExpiredUrls(@Param("now") LocalDateTime now);

    /**
     * Stats: total active URLs
     */
    @Query("SELECT COUNT(u) FROM Url u WHERE u.isActive = true")
    long countActiveUrls();

    /**
     * Stats: total redirects ever
     */
    @Query("SELECT COALESCE(SUM(u.clickCount), 0) FROM Url u")
    long sumTotalClicks();

    /**
     * Top URLs by click count (for analytics dashboard)
     */
    @Query("SELECT u FROM Url u WHERE u.isActive = true ORDER BY u.clickCount DESC")
    List<Url> findTopUrlsByClickCount(org.springframework.data.domain.Pageable pageable);

    /**
     * Recent URLs (for dashboard)
     */
    List<Url> findTop10ByIsActiveTrueOrderByCreatedAtDesc();
}
