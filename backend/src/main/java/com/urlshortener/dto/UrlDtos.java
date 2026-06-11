package com.urlshortener.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDateTime;

/**
 * All DTOs for the URL Shortener API
 */
public class UrlDtos {

    // ===================== REQUEST DTOs =====================

    @Data
    public static class CreateUrlRequest {

        @NotBlank(message = "URL is required")
        @URL(message = "Must be a valid URL (include https://)")
        @Size(max = 2048, message = "URL must be less than 2048 characters")
        private String originalUrl;

        @Size(max = 100, message = "Title must be less than 100 characters")
        private String title;

        /**
         * Optional custom alias (e.g. "my-project" → domain.com/my-project)
         * Letters, numbers, hyphens only
         */
        @Pattern(regexp = "^[a-zA-Z0-9-]{3,20}$",
                 message = "Custom alias must be 3-20 alphanumeric/hyphen characters")
        private String customAlias;

        /**
         * Optional expiration (ISO 8601). Null = never expires.
         */
        private LocalDateTime expiresAt;
    }

    @Data
    public static class UpdateUrlRequest {
        private Boolean isActive;
        private LocalDateTime expiresAt;
        private String title;
    }

    // ===================== RESPONSE DTOs =====================

    @Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class UrlResponse {
        private String shortCode;
        private String shortUrl;
        private String originalUrl;
        private String title;
        private Long clickCount;
        private Boolean isActive;
        private LocalDateTime createdAt;
        private LocalDateTime expiresAt;
        private LocalDateTime lastAccessedAt;
    }

    @Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class StatsResponse {
        private long totalUrls;
        private long totalRedirects;
        private long clicksLast24h;
        private long clicksLastHour;
        private double cacheHitRate;
        private String avgRedirectLatencyMs;
        private String snowflakeMachineId;
    }

    @Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class UrlAnalyticsResponse {
        private String shortCode;
        private String shortUrl;
        private String originalUrl;
        private Long totalClicks;
        private LocalDateTime createdAt;
        private java.util.List<DailyClicks> clicksByDay;
        private java.util.Map<String, Long> deviceBreakdown;
    }

    @Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DailyClicks {
        private String date;
        private Long count;
    }

    @Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ErrorResponse {
        private int status;
        private String error;
        private String message;
        private long timestamp;
    }

    @Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RateLimitResponse {
        private String message;
        private long retryAfterSeconds;
        private int limit;
        private int remaining;
    }
}
