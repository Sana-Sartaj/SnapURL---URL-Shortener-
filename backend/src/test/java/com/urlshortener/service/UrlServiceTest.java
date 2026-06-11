package com.urlshortener.service;

import com.urlshortener.dto.UrlDtos.*;
import com.urlshortener.exception.ShortCodeNotFoundException;
import com.urlshortener.model.Url;
import com.urlshortener.repository.ClickAnalyticsRepository;
import com.urlshortener.repository.UrlRepository;
import com.urlshortener.util.SnowflakeIdGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UrlService Tests")
class UrlServiceTest {

    @Mock private UrlRepository urlRepository;
    @Mock private ClickAnalyticsRepository clickAnalyticsRepository;
    @Mock private SnowflakeIdGenerator snowflakeIdGenerator;
    @Mock private CacheService cacheService;

    @InjectMocks
    private UrlService urlService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(urlService, "baseUrl", "http://localhost:8080");
    }

    // ── createShortUrl ────────────────────────────────────────────

    @Test
    @DisplayName("createShortUrl generates Snowflake ID and Base62 short code")
    void shouldCreateShortUrl() {
        // given
        long snowflakeId = 1704067200000001L;
        when(snowflakeIdGenerator.nextId()).thenReturn(snowflakeId);
        when(snowflakeIdGenerator.generateShortCode()).thenReturn("aBcDe7K");
        when(urlRepository.existsByShortCode("aBcDe7K")).thenReturn(false);

        Url savedUrl = Url.builder()
            .id(snowflakeId)
            .shortCode("aBcDe7K")
            .originalUrl("https://example.com")
            .isActive(true)
            .clickCount(0L)
            .createdAt(LocalDateTime.now())
            .build();
        when(urlRepository.save(any(Url.class))).thenReturn(savedUrl);

        CreateUrlRequest request = new CreateUrlRequest();
        request.setOriginalUrl("https://example.com");

        // when
        UrlResponse response = urlService.createShortUrl(request, "127.0.0.1");

        // then
        assertThat(response.getShortCode()).isEqualTo("aBcDe7K");
        assertThat(response.getShortUrl()).isEqualTo("http://localhost:8080/aBcDe7K");
        assertThat(response.getOriginalUrl()).isEqualTo("https://example.com");

        verify(urlRepository).save(argThat(url ->
            url.getShortCode().equals("aBcDe7K") &&
            url.getOriginalUrl().equals("https://example.com") &&
            url.getCreatedByIp().equals("127.0.0.1")
        ));
        verify(cacheService).putUrl("aBcDe7K", "https://example.com");
    }

    @Test
    @DisplayName("createShortUrl uses custom alias when provided")
    void shouldUseCustomAlias() {
        // given
        when(urlRepository.existsByShortCode("my-link")).thenReturn(false);
        when(snowflakeIdGenerator.nextId()).thenReturn(12345L);

        Url savedUrl = Url.builder()
            .id(12345L).shortCode("my-link")
            .originalUrl("https://example.com")
            .isActive(true).clickCount(0L)
            .createdAt(LocalDateTime.now()).build();
        when(urlRepository.save(any())).thenReturn(savedUrl);

        CreateUrlRequest request = new CreateUrlRequest();
        request.setOriginalUrl("https://example.com");
        request.setCustomAlias("my-link");

        // when
        UrlResponse response = urlService.createShortUrl(request, "127.0.0.1");

        // then
        assertThat(response.getShortCode()).isEqualTo("my-link");
        verify(snowflakeIdGenerator, never()).generateShortCode(); // NOT called
    }

    @Test
    @DisplayName("createShortUrl throws when custom alias is taken")
    void shouldThrowWhenCustomAliasTaken() {
        when(urlRepository.existsByShortCode("taken")).thenReturn(true);

        CreateUrlRequest request = new CreateUrlRequest();
        request.setOriginalUrl("https://example.com");
        request.setCustomAlias("taken");

        assertThatThrownBy(() -> urlService.createShortUrl(request, "127.0.0.1"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("already taken");
    }

    // ── resolveUrl ────────────────────────────────────────────────

    @Test
    @DisplayName("resolveUrl returns URL from cache on cache hit")
    void shouldReturnCachedUrl() {
        // given
        when(cacheService.getUrl("aBcDe7K")).thenReturn(Optional.of("https://example.com"));

        // when
        String result = urlService.resolveUrl("aBcDe7K", "127.0.0.1", "Mozilla", null);

        // then
        assertThat(result).isEqualTo("https://example.com");
        verify(urlRepository, never()).findByShortCodeAndIsActiveTrue(any()); // DB not hit!
    }

    @Test
    @DisplayName("resolveUrl falls back to DB on cache miss and warms cache")
    void shouldFallbackToDbOnCacheMiss() {
        // given
        when(cacheService.getUrl("aBcDe7K")).thenReturn(Optional.empty());

        Url url = Url.builder()
            .id(1L).shortCode("aBcDe7K")
            .originalUrl("https://example.com")
            .isActive(true).clickCount(0L)
            .createdAt(LocalDateTime.now()).build();
        when(urlRepository.findByShortCodeAndIsActiveTrue("aBcDe7K")).thenReturn(Optional.of(url));

        // when
        String result = urlService.resolveUrl("aBcDe7K", "127.0.0.1", "Mozilla", null);

        // then
        assertThat(result).isEqualTo("https://example.com");
        verify(cacheService).putUrl("aBcDe7K", "https://example.com"); // cache warmed
    }

    @Test
    @DisplayName("resolveUrl throws ShortCodeNotFoundException for missing codes")
    void shouldThrowForMissingShortCode() {
        when(cacheService.getUrl("missing")).thenReturn(Optional.empty());
        when(urlRepository.findByShortCodeAndIsActiveTrue("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> urlService.resolveUrl("missing", "127.0.0.1", "", null))
            .isInstanceOf(ShortCodeNotFoundException.class);

        verify(cacheService).putNullUrl("missing"); // negative cache written
    }

    @Test
    @DisplayName("resolveUrl uses negative cache sentinel correctly")
    void shouldRespectNegativeCache() {
        when(cacheService.getUrl("notexist")).thenReturn(Optional.of("__NULL__"));

        assertThatThrownBy(() -> urlService.resolveUrl("notexist", "127.0.0.1", "", null))
            .isInstanceOf(ShortCodeNotFoundException.class);

        verify(urlRepository, never()).findByShortCodeAndIsActiveTrue(any()); // DB not hit
    }

    // ── deleteUrl ─────────────────────────────────────────────────

    @Test
    @DisplayName("deleteUrl deactivates URL and evicts cache")
    void shouldDeleteUrl() {
        Url url = Url.builder()
            .id(1L).shortCode("aBcDe7K")
            .originalUrl("https://example.com")
            .isActive(true).clickCount(0L)
            .createdAt(LocalDateTime.now()).build();
        when(urlRepository.findByShortCode("aBcDe7K")).thenReturn(Optional.of(url));
        when(urlRepository.save(any())).thenReturn(url);

        urlService.deleteUrl("aBcDe7K");

        assertThat(url.getIsActive()).isFalse();
        verify(cacheService).evictUrl("aBcDe7K");
    }
}
