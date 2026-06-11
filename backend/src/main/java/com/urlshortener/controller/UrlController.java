package com.urlshortener.controller;

import com.urlshortener.dto.UrlDtos.*;
import com.urlshortener.service.RateLimitService;
import com.urlshortener.service.UrlService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API for URL management.
 *
 * Endpoints:
 *   POST   /api/urls          → Create short URL
 *   GET    /api/urls/{code}   → Get URL info
 *   PUT    /api/urls/{code}   → Update URL
 *   DELETE /api/urls/{code}   → Deactivate URL
 *   GET    /api/urls/recent   → Recent URLs
 *   GET    /api/urls/top      → Top URLs by clicks
 *   GET    /api/stats         → Global statistics
 *   GET    /api/analytics/{code} → URL analytics
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UrlController {

    private final UrlService urlService;
    private final RateLimitService rateLimitService;

    @PostMapping("/urls")
    public ResponseEntity<UrlResponse> createUrl(
            @Valid @RequestBody CreateUrlRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = extractClientIp(httpRequest);

        // Rate limit: 10 creates/min per IP
        rateLimitService.checkCreateLimit(clientIp);

        UrlResponse response = urlService.createShortUrl(request, clientIp);

        int remaining = rateLimitService.getRemainingRequests("create", clientIp, rateLimitService.getCreateLimit());

        return ResponseEntity.status(HttpStatus.CREATED)
            .header("X-RateLimit-Limit", String.valueOf(rateLimitService.getCreateLimit()))
            .header("X-RateLimit-Remaining", String.valueOf(remaining))
            .header("X-Short-Code", response.getShortCode())
            .body(response);
    }

    @GetMapping("/urls/recent")
    public ResponseEntity<List<UrlResponse>> getRecentUrls() {
        return ResponseEntity.ok(urlService.getRecentUrls());
    }

    @GetMapping("/urls/top")
    public ResponseEntity<List<UrlResponse>> getTopUrls() {
        return ResponseEntity.ok(urlService.getTopUrls());
    }

    @GetMapping("/urls/{shortCode}")
    public ResponseEntity<UrlResponse> getUrl(@PathVariable String shortCode) {
        return ResponseEntity.ok(urlService.getUrl(shortCode));
    }

    @PutMapping("/urls/{shortCode}")
    public ResponseEntity<UrlResponse> updateUrl(
            @PathVariable String shortCode,
            @RequestBody UpdateUrlRequest request) {
        return ResponseEntity.ok(urlService.updateUrl(shortCode, request));
    }

    @DeleteMapping("/urls/{shortCode}")
    public ResponseEntity<Map<String, String>> deleteUrl(@PathVariable String shortCode) {
        urlService.deleteUrl(shortCode);
        return ResponseEntity.ok(Map.of(
            "message", "URL deactivated successfully",
            "shortCode", shortCode
        ));
    }

    @GetMapping("/stats")
    public ResponseEntity<StatsResponse> getStats() {
        return ResponseEntity.ok(urlService.getStats());
    }

    @GetMapping("/analytics/{shortCode}")
    public ResponseEntity<UrlAnalyticsResponse> getAnalytics(
            @PathVariable String shortCode,
            HttpServletRequest httpRequest) {

        rateLimitService.checkAnalyticsLimit(extractClientIp(httpRequest));
        return ResponseEntity.ok(urlService.getUrlAnalytics(shortCode));
    }

    private String extractClientIp(HttpServletRequest request) {
        // Check X-Forwarded-For header (set by load balancer/proxy)
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
