package com.urlshortener.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Click analytics — each redirect is recorded here asynchronously.
 * Written async so it never blocks the hot redirect path.
 */
@Entity
@Table(name = "click_analytics", indexes = {
    @Index(name = "idx_click_url_id", columnList = "url_id"),
    @Index(name = "idx_click_timestamp", columnList = "clicked_at"),
    @Index(name = "idx_click_short_code", columnList = "short_code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClickAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "url_id", nullable = false)
    private Long urlId;

    @Column(name = "short_code", nullable = false, length = 10)
    private String shortCode;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "referer", length = 500)
    private String referer;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "device_type", length = 50)
    private String deviceType; // MOBILE, DESKTOP, TABLET, BOT

    @CreationTimestamp
    @Column(name = "clicked_at", nullable = false, updatable = false)
    private LocalDateTime clickedAt;
}
